import io
from datetime import date, timedelta

import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session, joinedload

from database import get_db
from model import Medico, MedicoAccesos, MedicoContacto, MedicoContratacion, MedicoNormativos
from routers.auth import get_current_user

router = APIRouter(tags=["Reportes"])

CAMPOS_FECHA_NORMATIVOS = [
    ("bls_fecha_venc",         "BLS"),
    ("acls_fecha_venc",        "ACLS"),
    ("pals_fecha_venc",        "PALS"),
    ("nals_fecha_venc",        "NALS"),
    ("violencia_sexual_fecha", "Violencia Sexual"),
    ("ataques_quimicos_fecha", "Ataques Agentes Químicos"),
    ("dengue_fecha",           "Dengue"),
    ("sedacion_fecha",         "Sedación"),
    ("radioproteccion_fecha",  "Radioprotección"),
    ("manejo_dolor_fecha",     "Manejo del Dolor"),
    ("iamii_fecha",            "IAMII"),
    ("gestion_duelo_fecha",    "Gestión del Duelo"),
]


def _build_alertas(db: Session):
    hoy = date.today()
    alertas = []

    normativos = (
        db.query(MedicoNormativos)
        .options(joinedload(MedicoNormativos.medico).joinedload(Medico.datos_hv))
        .all()
    )

    for n in normativos:
        medico = n.medico
        if medico is None:
            continue
        tipo_doc = medico.datos_hv.tipo_documento if medico.datos_hv else ""
        for campo, nombre_doc in CAMPOS_FECHA_NORMATIVOS:
            fecha = getattr(n, campo, None)
            if fecha is None:
                continue
            dias_restantes = (fecha - hoy).days
            estado = "Vencido" if dias_restantes < 0 else "Por vencer"
            alertas.append({
                "Documento": medico.documento_identidad,
                "Nombre": medico.nombre_medico,
                "Tipo Documento": tipo_doc,
                "Fecha Vencimiento": fecha.isoformat(),
                "Días Restantes": dias_restantes,
                "Estado": estado,
            })

    accesos = (
        db.query(MedicoAccesos)
        .options(joinedload(MedicoAccesos.medico).joinedload(Medico.datos_hv))
        .filter(MedicoAccesos.fecha_venc_poliza.isnot(None))
        .all()
    )

    for a in accesos:
        medico = a.medico
        if medico is None or a.fecha_venc_poliza is None:
            continue
        tipo_doc = medico.datos_hv.tipo_documento if medico.datos_hv else ""
        dias_restantes = (a.fecha_venc_poliza - hoy).days
        estado = "Vencido" if dias_restantes < 0 else "Por vencer"
        alertas.append({
            "Documento": medico.documento_identidad,
            "Nombre": medico.nombre_medico,
            "Tipo Documento": tipo_doc,
            "Fecha Vencimiento": a.fecha_venc_poliza.isoformat(),
            "Días Restantes": dias_restantes,
            "Estado": estado,
        })

    alertas.sort(key=lambda x: x["Días Restantes"])
    return alertas


@router.get("/exportar")
def exportar_medicos_xlsx(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    medicos = (
        db.query(Medico)
        .options(
            joinedload(Medico.contratacion),
            joinedload(Medico.contacto),
        )
        .all()
    )

    data_medicos = []
    for m in medicos:
        c = m.contratacion
        k = m.contacto
        data_medicos.append({
            "Documento": m.documento_identidad,
            "Nombre": m.nombre_medico,
            "Categoría": m.categoria,
            "Especialidad": m.especialidad,
            "Estado": m.estado,
            "Tipo Listado": m.tipo_listado,
            "Fecha Ingreso": str(m.fecha_ingreso) if m.fecha_ingreso else "",
            "Tipo Vinculación": c.tipo_vinculacion if c else "",
            "Fecha Venc Oferta": str(c.fecha_venc_oferta) if c and c.fecha_venc_oferta else "",
            "Correo": k.correo if k else "",
            "Celular": k.celular if k else "",
        })

    alertas = _build_alertas(db)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pd.DataFrame(data_medicos).to_excel(writer, index=False, sheet_name="Médicos")
        pd.DataFrame(alertas).to_excel(writer, index=False, sheet_name="Alertas Vencimiento")

    output.seek(0)
    headers = {"Content-Disposition": 'attachment; filename="reporte_medicos.xlsx"'}
    return StreamingResponse(
        output,
        headers=headers,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/exportar-alertas")
def exportar_alertas_xlsx(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    alertas = [a for a in _build_alertas(db) if a["Días Restantes"] <= 30]

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        pd.DataFrame(alertas).to_excel(writer, index=False, sheet_name="Alertas")

    output.seek(0)
    headers = {"Content-Disposition": 'attachment; filename="alertas_vencimiento.xlsx"'}
    return StreamingResponse(
        output,
        headers=headers,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/exportar-pdf")
def exportar_pdf(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    hoy = date.today()
    header_color = HexColor("#1a3c6e")
    styles = getSampleStyleSheet()

    total = db.query(sa_func.count(Medico.id)).scalar() or 0
    activos = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "ACTIVO").scalar() or 0
    finalizados = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "FINALIZADO").scalar() or 0
    renuncias = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "RENUNCIA").scalar() or 0
    inactivos = db.query(sa_func.count(Medico.id)).filter(Medico.estado == "INACTIVO").scalar() or 0

    limite = hoy + timedelta(days=30)
    medicos_con_alerta = set()
    for n in db.query(MedicoNormativos).all():
        for campo, _ in CAMPOS_FECHA_NORMATIVOS:
            fecha = getattr(n, campo, None)
            if fecha is not None and fecha <= limite:
                medicos_con_alerta.add(n.medico_id)
                break
    alertas_count = len(medicos_con_alerta)

    alertas_30 = [a for a in _build_alertas(db) if a["Días Restantes"] <= 30]

    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=letter, rightMargin=inch, leftMargin=inch, topMargin=inch, bottomMargin=inch)

    story = []

    story.append(Paragraph("Reporte Ejecutivo — Cuerpo Médico", styles["Title"]))
    story.append(Paragraph(f"Fecha de generación: {hoy.isoformat()}", styles["Normal"]))
    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("Resumen General", styles["Heading2"]))
    story.append(Spacer(1, 0.1 * inch))

    resumen_data = [
        ["Indicador", "Valor"],
        ["Total Médicos", str(total)],
        ["Activos", str(activos)],
        ["Finalizados", str(finalizados)],
        ["Renuncias", str(renuncias)],
        ["Inactivos", str(inactivos)],
        ["Alertas Venc.", str(alertas_count)],
    ]

    resumen_table = Table(resumen_data, colWidths=[3 * inch, 2 * inch])
    resumen_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(resumen_table)
    story.append(Spacer(1, 0.3 * inch))

    story.append(Paragraph("Médicos con Documentos Por Vencer (≤30 días)", styles["Heading2"]))
    story.append(Spacer(1, 0.1 * inch))

    if alertas_30:
        alertas_data = [["Nombre", "Tipo Documento", "Fecha Vencimiento", "Días Restantes"]]
        for a in alertas_30:
            alertas_data.append([
                a["Nombre"],
                a["Tipo Documento"],
                a["Fecha Vencimiento"],
                str(a["Días Restantes"]),
            ])

        col_widths = [2.2 * inch, 1.8 * inch, 1.5 * inch, 1.2 * inch]
        alertas_table = Table(alertas_data, colWidths=col_widths)
        alertas_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), header_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(alertas_table)
    else:
        story.append(Paragraph("No hay médicos con documentos por vencer en los próximos 30 días.", styles["Normal"]))

    doc.build(story)
    output.seek(0)

    headers = {"Content-Disposition": 'attachment; filename="reporte_ejecutivo.pdf"'}
    return StreamingResponse(iter([output.getvalue()]), headers=headers, media_type="application/pdf")
