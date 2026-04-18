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


@router.get("/dashboard/resumen/")
def dashboard_resumen(db: Session = Depends(get_db)):
    """Resumen de KPIs para el dashboard."""
    total = db.query(sa_func.count(Medico.id)).scalar() or 0
    activos = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "ACTIVO").scalar() or 0
    en_proceso = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "EN_PROCESO").scalar() or 0
    inactivos = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "INACTIVO").scalar() or 0
    finalizados = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "FINALIZADO").scalar() or 0
    renuncias = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "RENUNCIA").scalar() or 0

    # Calcular alertas de vencimiento (próximos 30 días)
    alertas = _contar_alertas_vencimiento(db, dias_limite=30)

    # Por categoría
    por_cat = (
        db.query(Medico.categoria, sa_func.count(Medico.id))
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
    ("bls_fecha_venc",           "BLS"),
    ("acls_fecha_venc",          "ACLS"),
    ("pals_fecha_venc",          "PALS"),
    ("nals_fecha_venc",          "NALS"),
    ("violencia_sexual_fecha",   "Violencia Sexual"),
    ("ataques_quimicos_fecha",   "Ataques Agentes Químicos"),
    ("dengue_fecha",             "Dengue"),
    ("sedacion_fecha",           "Sedación"),
    ("radioproteccion_fecha",    "Radioprotección"),
    ("manejo_dolor_fecha",       "Manejo del Dolor"),
    ("iamii_fecha",              "IAMII"),
    ("gestion_duelo_fecha",      "Gestión del Duelo"),
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
