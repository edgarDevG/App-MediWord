"""
Router: /api/v1/dashboard — KPIs y resumen
Router: /api/v1/notificaciones — Alertas de vencimiento (v1 + v2 categorizado)
"""
from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func as sa_func
from database import get_db
from model import Medico, MedicoNormativos, MedicoAccesos, MedicoContratacion, MedicoPrerrogativas

router = APIRouter(tags=["Dashboard"])

# ═══════════════════════════════════════════════════════════════
# NOTIFICACIONES DE VENCIMIENTO
# ═══════════════════════════════════════════════════════════════

# ── Soporte vital ──
CAMPOS_SOPORTE_VITAL = [
    ("bls_fecha_venc",  "BLS"),
    ("acls_fecha_venc", "ACLS"),
    ("pals_fecha_venc", "PALS"),
    ("nals_fecha_venc", "NALS"),
]

# ── Cursos normativos ──
CAMPOS_NORMATIVOS_CURSOS = [
    ("violencia_sexual_fecha",   "Violencia Sexual"),
    ("ataques_quimicos_fecha",   "Agentes Químicos"),
    ("dengue_fecha",             "Dengue"),
    ("sedacion_fecha",           "Sedación"),
    ("radioproteccion_fecha",    "Radioprotección"),
    ("manejo_dolor_fecha",       "Manejo del Dolor"),
    ("iamii_fecha",              "IAMII"),
    ("gestion_duelo_fecha",      "Gestión del Duelo"),
    ("aiepi_fecha",              "AIEPI"),
    ("gestion_donante_fecha",    "Gestión Donante"),
    ("telemedicina_fecha",       "Telemedicina"),
    ("cursos_3_anios_fecha_venc","Cursos 3 años"),
]

# Lista unificada (para compatibilidad con endpoints v1)
CAMPOS_FECHA_NORMATIVOS = CAMPOS_SOPORTE_VITAL + CAMPOS_NORMATIVOS_CURSOS

def _nivel_doc(dias: int) -> str:
    if dias < 0:
        return "critico"
    if dias <= 7:
        return "urgente"
    return "proximo"

NIVEL_ORDER = {"critico": 0, "urgente": 1, "proximo": 2}

def _contar_alertas_vencimiento(db: Session, dias_limite: int = 30) -> int:
    """Cuenta cuántos médicos tienen al menos un documento vencido o por vencer."""
    hoy = date.today()
    medicos_con_alerta = set()

    normativos = db.query(MedicoNormativos).all()
    for n in normativos:
        for campo, _ in CAMPOS_FECHA_NORMATIVOS:
            fecha = getattr(n, campo, None)
            if fecha is not None and (fecha - hoy).days <= dias_limite:
                medicos_con_alerta.add(n.medico_id)
                break

    return len(medicos_con_alerta)


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
    alertas = []

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
                estado = "Vencido" if dias_restantes < 0 else "Por vencer"
                alertas.append({
                    "medico_id": medico.id,
                    "documento_identidad": medico.documento_identidad,
                    "nombre_medico": medico.nombre_medico,
                    "tipo_documento": nombre_doc,
                    "fecha_vencimiento": fecha.isoformat(),
                    "dias_restantes": dias_restantes,
                    "estado": estado,
                })

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

    alertas.sort(key=lambda x: x["dias_restantes"])
    return {"items": alertas, "total": len(alertas)}


@router.get("/notificaciones/resumen-medico")
def get_resumen_medico(
    dias_limite: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """
    [LEGACY v1] Una notificación por médico con todos sus documentos vencidos.
    Mantener por compatibilidad. Usar /resumen-categorizado para UI nueva.
    """
    hoy = date.today()
    por_medico: dict = {}

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

    def doc_label(d):
        if d["dias"] < 0:
            return f"{d['nombre']} vencido"
        if d["dias"] == 0:
            return f"{d['nombre']} vence hoy"
        return f"{d['nombre']} ({d['dias']}d)"

    resultado = []
    for bucket in por_medico.values():
        m = bucket["medico"]
        docs = bucket["docs"]
        nivel = min((_nivel_doc(d["dias"]) for d in docs), key=lambda n: NIVEL_ORDER[n])
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

    resultado.sort(key=lambda x: (NIVEL_ORDER[x["nivel"]], -x["total_alertas"]))
    return {"items": resultado, "total": len(resultado)}


# ═══════════════════════════════════════════════════════════════
# NUEVO: Notificaciones v2 — Categorizadas por médico
# ═══════════════════════════════════════════════════════════════

@router.get("/notificaciones/resumen-categorizado")
def get_resumen_categorizado(
    dias_limite: int = Query(30, ge=1, le=365),
    dias_contratacion: int = Query(20, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """
    Notificaciones v2: una entrada por médico con sus alertas agrupadas por categoría.
    Categorías: soporte_vital | normativos | polizas | contratacion | prerrogativas
    """
    hoy = date.today()

    # Estructura acumuladora: {medico_id: {medico, categorias: {cat_id: [items]}}}
    por_medico: dict = {}

    def get_bucket(medico_obj):
        mid = medico_obj.id
        if mid not in por_medico:
            por_medico[mid] = {
                "medico": medico_obj,
                "categorias": {
                    "soporte_vital":  [],
                    "normativos":     [],
                    "polizas":        [],
                    "contratacion":   [],
                    "prerrogativas":  [],
                },
            }
        return por_medico[mid]

    def add_item(bucket, cat_id, nombre, fecha, dias):
        bucket["categorias"][cat_id].append({
            "nombre": nombre,
            "fecha": fecha.isoformat() if fecha else None,
            "dias": dias,
            "nivel": _nivel_doc(dias),
        })

    # ── 1. Soporte vital y 2. Cursos normativos ──
    normativos = (
        db.query(MedicoNormativos)
        .options(joinedload(MedicoNormativos.medico))
        .all()
    )
    for n in normativos:
        medico = n.medico
        if medico is None:
            continue

        # Soporte vital
        for campo, nombre in CAMPOS_SOPORTE_VITAL:
            fecha = getattr(n, campo, None)
            if fecha is None:
                continue
            dias = (fecha - hoy).days
            if dias <= dias_limite:
                bucket = get_bucket(medico)
                add_item(bucket, "soporte_vital", nombre, fecha, dias)

        # Cursos normativos
        for campo, nombre in CAMPOS_NORMATIVOS_CURSOS:
            fecha = getattr(n, campo, None)
            if fecha is None:
                continue
            dias = (fecha - hoy).days
            if dias <= dias_limite:
                bucket = get_bucket(medico)
                add_item(bucket, "normativos", nombre, fecha, dias)

    # ── 3. Pólizas (MedicoAccesos) ──
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
            bucket = get_bucket(medico)
            add_item(bucket, "polizas", "Póliza Resp. Civil", a.fecha_venc_poliza, dias)

    # ── 4. Contratación (MedicoContratacion) ──
    contratos = (
        db.query(MedicoContratacion)
        .options(joinedload(MedicoContratacion.medico))
        .filter(MedicoContratacion.fecha_venc_oferta.isnot(None))
        .all()
    )
    for c in contratos:
        medico = c.medico
        if medico is None or c.fecha_venc_oferta is None:
            continue
        dias = (c.fecha_venc_oferta - hoy).days
        if dias <= dias_contratacion:
            bucket = get_bucket(medico)
            add_item(bucket, "contratacion", "Vencimiento de Oferta", c.fecha_venc_oferta, dias)

    # ── 5. Prerrogativas temporales (MedicoPrerrogativas) ──
    prerrogativas = (
        db.query(MedicoPrerrogativas)
        .options(joinedload(MedicoPrerrogativas.medico))
        .filter(MedicoPrerrogativas.pt_fecha_fin.isnot(None))
        .all()
    )
    for p in prerrogativas:
        medico = p.medico
        if medico is None:
            continue
        if p.pt_fecha_fin is not None:
            dias = (p.pt_fecha_fin - hoy).days
            if dias <= dias_limite:
                bucket = get_bucket(medico)
                add_item(bucket, "prerrogativas", "Fin Prerrogativas Temporales", p.pt_fecha_fin, dias)

        # También monitorear ampliación de temporales
        if p.amp_pt_fecha_fin is not None:
            dias_amp = (p.amp_pt_fecha_fin - hoy).days
            if dias_amp <= dias_limite:
                bucket = get_bucket(medico)
                add_item(bucket, "prerrogativas", "Fin Ampliación PT", p.amp_pt_fecha_fin, dias_amp)

    # ── Definición de categorías (metadatos) ──
    CAT_META = {
        "soporte_vital": {"label": "Soporte Vital",       "icon": "monitor_heart"},
        "normativos":    {"label": "Cursos Normativos",   "icon": "school"},
        "polizas":       {"label": "Pólizas",             "icon": "shield"},
        "contratacion":  {"label": "Contratación",        "icon": "description"},
        "prerrogativas": {"label": "Prerrogativas",       "icon": "verified_user"},
    }

    # ── Construir respuesta final ──
    resultado = []
    total_alertas_global = 0

    for bucket in por_medico.values():
        m = bucket["medico"]
        categorias_con_items = []
        todos_los_items = []

        for cat_id, items in bucket["categorias"].items():
            if not items:
                continue
            items_sorted = sorted(items, key=lambda i: i["dias"])
            nivel_cat = min(items_sorted, key=lambda i: NIVEL_ORDER[i["nivel"]])["nivel"]
            categorias_con_items.append({
                "id": cat_id,
                **CAT_META[cat_id],
                "nivel": nivel_cat,
                "total": len(items_sorted),
                "items": items_sorted,
            })
            todos_los_items.extend(items_sorted)

        if not categorias_con_items:
            continue

        categorias_con_items.sort(key=lambda c: NIVEL_ORDER[c["nivel"]])
        nivel_medico = categorias_con_items[0]["nivel"]
        total_medico = len(todos_los_items)
        total_alertas_global += total_medico

        resultado.append({
            "documento_identidad": m.documento_identidad,
            "nombre_medico": m.nombre_medico,
            "tipo_listado": m.tipo_listado or "cuerpo_medico",
            "nivel": nivel_medico,
            "total_alertas": total_medico,
            "vencidos":    sum(1 for i in todos_los_items if i["dias"] < 0),
            "por_vencer":  sum(1 for i in todos_los_items if i["dias"] >= 0),
            "categorias": categorias_con_items,
        })

    resultado.sort(key=lambda x: (NIVEL_ORDER[x["nivel"]], -x["total_alertas"]))

    return {
        "total_medicos": len(resultado),
        "total_alertas": total_alertas_global,
        "items": resultado,
    }
