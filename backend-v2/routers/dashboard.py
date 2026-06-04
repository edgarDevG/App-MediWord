"""
Router: /api/v1/dashboard — KPIs y resumen
Router: /api/v1/notificaciones — Alertas de vencimiento
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sa_func
from database import get_db
from model import Medico, MedicoNormativos, MedicoAccesos


router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/resumen")
@router.get("/dashboard/resumen/")
def dashboard_resumen(db: Session = Depends(get_db)):
    """Resumen de KPIs para el dashboard."""
    # ── Conteos por estado (todos los tipos) ──
    total       = db.query(sa_func.count(Medico.id)).scalar() or 0
    activos     = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "ACTIVO").scalar() or 0
    en_proceso  = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "EN_PROCESO").scalar() or 0
    inactivos   = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "INACTIVO").scalar() or 0
    finalizados = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "FINALIZADO").scalar() or 0
    renuncias   = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "RENUNCIA").scalar() or 0

    # ── Conteos por tipo_listado (origen inmutable) ──
    hsm_total    = db.query(sa_func.count(Medico.id)).filter(
        Medico.tipo_listado == "cuerpo_medico"
    ).scalar() or 0
    hsm_activos  = db.query(sa_func.count(Medico.id)).filter(
        Medico.tipo_listado == "cuerpo_medico", Medico.estado == "ACTIVO"
    ).scalar() or 0
    fsfb_total   = db.query(sa_func.count(Medico.id)).filter(
        Medico.tipo_listado == "fsfb_externo"
    ).scalar() or 0
    fsfb_activos = db.query(sa_func.count(Medico.id)).filter(
        Medico.tipo_listado == "fsfb_externo", Medico.estado == "ACTIVO"
    ).scalar() or 0

    alertas = _contar_alertas_vencimiento(db, dias_limite=30)

    # Por categoría — solo médicos HSM para el dashboard principal
    por_cat = (
        db.query(Medico.categoria, sa_func.count(Medico.id))
        .filter(Medico.tipo_listado == "cuerpo_medico")
        .group_by(Medico.categoria)
        .all()
    )

    return {
        "totales": {
            "total_medicos": total,
            "activos": activos,
            "en_proceso": en_proceso,
            "inactivos": inactivos,
            "finalizados": finalizados,
            "renuncias": renuncias,
            "alertas_vencimiento": alertas,
            "hsm_total": hsm_total,
            "hsm_activos": hsm_activos,
            "fsfb_total": fsfb_total,
            "fsfb_activos": fsfb_activos,
        },
        "por_categoria": [
            {"categoria": cat or "N/D", "total": cnt}
            for cat, cnt in por_cat if cat
        ],
    }


# ═══════════════════════════════════════════════════════════════
# NOTIFICACIONES DE VENCIMIENTO
# ═══════════════════════════════════════════════════════════════

# Campos con fecha de vencimiento en medicos_normativos
CAMPOS_FECHA_NORMATIVOS = [
    ("bls_fecha_venc",              "BLS"),
    ("acls_fecha_venc",             "ACLS"),
    ("pals_fecha_venc",             "PALS"),
    ("nals_fecha_venc",             "NALS"),
    ("violencia_sexual_fecha",      "Violencia Sexual"),
    ("ataques_quimicos_fecha",      "Agentes Químicos"),
    ("dengue_fecha",                "Dengue"),
    ("sedacion_fecha",              "Sedación"),
    ("radioproteccion_fecha",       "Radioprotección"),
    ("manejo_dolor_fecha",          "Manejo del Dolor"),
    ("iamii_fecha",                 "IAMII"),
    ("gestion_duelo_fecha",         "Gestión del Duelo"),
]


def _contar_alertas_vencimiento(db: Session, dias_limite: int = 30) -> int:
    """Cuenta cuántos médicos tienen al menos un documento vencido o por vencer."""
    hoy = date.today()
    limite = hoy + timedelta(days=dias_limite)
    count = 0

    normativos = db.query(MedicoNormativos).all()
    medicos_con_alerta = set()

    for n in normativos:
        for campo, _ in CAMPOS_FECHA_NORMATIVOS:
            fecha = getattr(n, campo, None)
            if fecha is not None and fecha <= limite:
                medicos_con_alerta.add(n.medico_id)
                break  # con una alerta por médico basta para el conteo

    return len(medicos_con_alerta)


@router.get("/notificaciones/vencimientos")
def get_vencimientos(
    dias_limite: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """
    Retorna la lista de documentos vencidos o próximos a vencer.
    Incluye: tipo_documento, fecha_vencimiento, días_restantes, médico.
    """
    hoy = date.today()
    limite = hoy + timedelta(days=dias_limite)
    alertas = []

    # Normativos con su médico
    normativos = (
        db.query(MedicoNormativos)
        .options(joinedload(MedicoNormativos.medico))
        .all()
    )

    for n in normativos:
        medico = n.medico
        if medico is None:
            continue

        for campo, nombre_doc in CAMPOS_FECHA_NORMATIVOS:
            fecha = getattr(n, campo, None)
            if fecha is None:
                continue

            dias_restantes = (fecha - hoy).days
            if dias_restantes <= dias_limite:
                # Determinar estado
                if dias_restantes < 0:
                    estado = "Vencido"
                elif dias_restantes <= 30:
                    estado = "Por vencer"
                else:
                    estado = "OK"

                alertas.append({
                    "medico_id": medico.id,
                    "documento_identidad": medico.documento_identidad,
                    "nombre_medico": medico.nombre_medico,
                    "tipo_documento": nombre_doc,
                    "fecha_vencimiento": fecha.isoformat(),
                    "dias_restantes": dias_restantes,
                    "estado": estado,
                })

    # Póliza de responsabilidad civil (en medicos_accesos)
    accesos = (
        db.query(MedicoAccesos)
        .options(joinedload(MedicoAccesos.medico))
        .filter(MedicoAccesos.fecha_venc_poliza.isnot(None))
        .all()
    )

    for a in accesos:
        medico = a.medico
        if medico is None or a.fecha_venc_poliza is None:
            continue

        dias_restantes = (a.fecha_venc_poliza - hoy).days
        if dias_restantes <= dias_limite:
            estado = "Vencido" if dias_restantes < 0 else "Por vencer"
            alertas.append({
                "medico_id": medico.id,
                "documento_identidad": medico.documento_identidad,
                "nombre_medico": medico.nombre_medico,
                "tipo_documento": "Póliza Resp. Civil",
                "fecha_vencimiento": a.fecha_venc_poliza.isoformat(),
                "dias_restantes": dias_restantes,
                "estado": estado,
            })

    # Ordenar: vencidos primero, luego por días restantes ascendente
    alertas.sort(key=lambda x: x["dias_restantes"])

    return {"items": alertas, "total": len(alertas)}


@router.get("/notificaciones/resumen-medico")
def get_resumen_medico(
    dias_limite: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """
    Una notificación por médico que agrupa todos sus documentos vencidos o por vencer.
    Nivel de severidad: critico (vencido) > urgente (≤7d) > proximo (≤30d).
    """
    hoy = date.today()
    limite = hoy + timedelta(days=dias_limite)

    # Acumular alertas por médico: {medico_id: {"medico": obj, "docs": [...]}}
    por_medico: dict = {}

    # ── Normativos ──
    normativos = (
        db.query(MedicoNormativos)
        .options(joinedload(MedicoNormativos.medico))
        .all()
    )
    for n in normativos:
        medico = n.medico
        if medico is None:
            continue
        for campo, nombre_doc in CAMPOS_FECHA_NORMATIVOS:
            fecha = getattr(n, campo, None)
            if fecha is None:
                continue
            dias = (fecha - hoy).days
            if dias <= dias_limite:
                bucket = por_medico.setdefault(medico.id, {"medico": medico, "docs": []})
                bucket["docs"].append({"nombre": nombre_doc, "dias": dias})

    # ── Póliza responsabilidad civil ──
    accesos = (
        db.query(MedicoAccesos)
        .options(joinedload(MedicoAccesos.medico))
        .filter(MedicoAccesos.fecha_venc_poliza.isnot(None))
        .all()
    )
    for a in accesos:
        medico = a.medico
        if medico is None or a.fecha_venc_poliza is None:
            continue
        dias = (a.fecha_venc_poliza - hoy).days
        if dias <= dias_limite:
            bucket = por_medico.setdefault(medico.id, {"medico": medico, "docs": []})
            bucket["docs"].append({"nombre": "Póliza Resp. Civil", "dias": dias})

    # ── Construir respuesta agrupada ──
    def nivel_doc(dias: int) -> str:
        if dias < 0:
            return "critico"
        if dias <= 7:
            return "urgente"
        return "proximo"

    NIVEL_ORDER = {"critico": 0, "urgente": 1, "proximo": 2}

    resultado = []
    for bucket in por_medico.values():
        m = bucket["medico"]
        docs = bucket["docs"]

        # Nivel máximo del grupo
        nivel = min((nivel_doc(d["dias"]) for d in docs), key=lambda n: NIVEL_ORDER[n])

        # Construir texto resumen
        def doc_label(d):
            if d["dias"] < 0:
                return f"{d['nombre']} vencido"
            if d["dias"] == 0:
                return f"{d['nombre']} vence hoy"
            return f"{d['nombre']} ({d['dias']}d)"

        resumen = " · ".join(doc_label(d) for d in sorted(docs, key=lambda d: d["dias"]))

        resultado.append({
            "documento_identidad": m.documento_identidad,
            "nombre_medico": m.nombre_medico,
            "tipo_listado": m.tipo_listado or "cuerpo_medico",
            "total_alertas": len(docs),
            "vencidos": sum(1 for d in docs if d["dias"] < 0),
            "por_vencer": sum(1 for d in docs if d["dias"] >= 0),
            "nivel": nivel,
            "resumen": resumen,
        })

    # Ordenar: críticos primero, luego urgentes, luego próximos; dentro de cada nivel por total_alertas desc
    resultado.sort(key=lambda x: (NIVEL_ORDER[x["nivel"]], -x["total_alertas"]))

    return {"items": resultado, "total": len(resultado)}


