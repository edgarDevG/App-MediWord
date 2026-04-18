"""
Router: /api/v1/medicos — CRUD + sub-recursos por carpeta
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from database import get_db
from model import (
    Medico, MedicoDatosHV, MedicoContacto, MedicoPrerrogativas,
    MedicoDiplomas, MedicoNormativos, MedicoContratacion, MedicoAccesos,
    Seccion, Departamento, User,
)
from routers.auth import get_current_user
from schemas import (
    MedicoCreate, MedicoUpdate, MedicoOut, MedicoListOut,
    EstadoUpdate,
    DatosHVUpdate, DatosHVOut,
    ContactoUpdate, ContactoOut,
    PrerrogativasUpdate, PrerrogativasOut,
    DiplomasUpdate, DiplomasOut,
    NormativosUpdate, NormativosOut, calcular_estado,
    ContratacionUpdate, ContratacionOut,
    AccesosUpdate, AccesosOut,
)

router = APIRouter(tags=["Médicos"])


# ── Helpers ───────────────────────────────────────────────────

def get_medico_or_404(documento: str, db: Session) -> Medico:
    m = db.query(Medico).filter(Medico.documento_identidad == documento).first()
    if not m:
        raise HTTPException(404, f"Médico {documento} no encontrado")
    return m


def enrich(items: list[Medico], db: Session) -> list[MedicoOut]:
    sec_ids  = {m.seccion_id           for m in items if m.seccion_id}
    dept_ids = {m.dept_coordinacion_id for m in items if m.dept_coordinacion_id}
    sec_map  = {s.id: s.nombre for s in db.query(Seccion).filter(Seccion.id.in_(sec_ids)).all()}         if sec_ids  else {}
    dept_map = {d.id: d.nombre for d in db.query(Departamento).filter(Departamento.id.in_(dept_ids)).all()} if dept_ids else {}
    result = []
    for m in items:
        out = MedicoOut.model_validate(m)
        out.seccion_nombre           = sec_map.get(m.seccion_id)
        out.dept_coordinacion_nombre = dept_map.get(m.dept_coordinacion_id)
        result.append(out)
    return result


def upsert_sub(db: Session, model_cls, medico_id: int, data: dict):
    """Insert or update a sub-resource row by medico_id."""
    obj = db.query(model_cls).filter(model_cls.medico_id == medico_id).first()
    if obj:
        for k, v in data.items():
            if v is not None:
                setattr(obj, k, v)
    else:
        obj = model_cls(medico_id=medico_id, **{k: v for k, v in data.items() if v is not None})
        db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


# ═══════════════════════════════════════════════════════════════
# MÉDICOS — CRUD principal
# ═══════════════════════════════════════════════════════════════

@router.get("/medicos/", response_model=MedicoListOut)
def list_medicos(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: str = Query("", description="Buscar por nombre, documento o especialidad"),
    categoria: str = Query("", description="Filtrar por categoría"),
    estado: str = Query("", description="Filtrar por estado"),
    tipo_listado: str = Query("", description="Filtrar por tipo_listado (cuerpo_medico|fsfb_externo|inactivo|renuncia|finalizacion)"),
    db: Session = Depends(get_db),
):
    q = db.query(Medico)

    if search:
        like = f"%{search}%"
        q = q.filter(
            (Medico.nombre_medico.ilike(like)) |
            (Medico.documento_identidad.ilike(like)) |
            (Medico.especialidad.ilike(like))
        )
    if categoria:
        q = q.filter(Medico.categoria == categoria)
    if estado:
        q = q.filter(Medico.estado == estado)
    if tipo_listado:
        q = q.filter(Medico.tipo_listado == tipo_listado)

    total = q.count()
    items = q.order_by(Medico.nombre_medico).offset((page - 1) * size).limit(size).all()

    return MedicoListOut(
        items=enrich(items, db),
        total=total, page=page, size=size,
    )


@router.post("/medicos/", response_model=MedicoOut, status_code=201)
def create_medico(data: MedicoCreate, db: Session = Depends(get_db)):
    existing = db.query(Medico).filter(Medico.documento_identidad == data.documento_identidad).first()
    if existing:
        raise HTTPException(409, "Ya existe un médico con ese documento")

    medico = Medico(**data.model_dump(exclude_none=True))
    db.add(medico)
    db.commit()
    db.refresh(medico)
    return medico


@router.get("/medicos/{documento}/", response_model=MedicoOut)
def get_medico(documento: str, db: Session = Depends(get_db)):
    return get_medico_or_404(documento, db)


@router.put("/medicos/{documento}/", response_model=MedicoOut)
def update_medico(documento: str, data: MedicoUpdate, db: Session = Depends(get_db)):
    medico = get_medico_or_404(documento, db)
    update_data = data.model_dump(exclude_none=True)

    # Rebuild nombre_medico if name fields changed
    if any(k in update_data for k in ["primer_nombre", "segundo_nombre", "primer_apellido", "segundo_apellido"]):
        pn = update_data.get("primer_nombre", medico.primer_nombre)
        sn = update_data.get("segundo_nombre", medico.segundo_nombre)
        pa = update_data.get("primer_apellido", medico.primer_apellido)
        sa = update_data.get("segundo_apellido", medico.segundo_apellido)
        update_data["nombre_medico"] = " ".join(p for p in [pn, sn, pa, sa] if p)

    for k, v in update_data.items():
        setattr(medico, k, v)

    db.commit()
    db.refresh(medico)
    return medico


@router.patch("/medicos/{documento}/estado", response_model=MedicoOut)
def patch_medico_estado(
    documento: str,
    data: EstadoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.rol != "admin":
        raise HTTPException(403, "Solo administradores pueden cambiar el estado de un médico")
    medico = get_medico_or_404(documento, db)
    medico.estado = data.estado
    medico.tipo_listado = data.tipo_listado
    db.commit()
    db.refresh(medico)
    return medico


# ═══════════════════════════════════════════════════════════════
# SUB-RECURSOS — guardar por carpeta
# ═══════════════════════════════════════════════════════════════

# ── Documentos HV ─────────────────────────────────────────────
@router.get("/medicos/{documento}/documentos-hv/", response_model=DatosHVOut)
def get_datos_hv(documento: str, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    obj = db.query(MedicoDatosHV).filter(MedicoDatosHV.medico_id == m.id).first()
    if not obj:
        raise HTTPException(404, "Sin datos HV para este médico")
    return obj


@router.put("/medicos/{documento}/documentos-hv/", response_model=DatosHVOut)
def update_datos_hv(documento: str, data: DatosHVUpdate, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    return upsert_sub(db, MedicoDatosHV, m.id, data.model_dump())


# ── Contacto ──────────────────────────────────────────────────
@router.get("/medicos/{documento}/contacto/", response_model=ContactoOut)
def get_contacto(documento: str, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    obj = db.query(MedicoContacto).filter(MedicoContacto.medico_id == m.id).first()
    if not obj:
        raise HTTPException(404, "Sin datos de contacto para este médico")
    return obj


@router.put("/medicos/{documento}/contacto/", response_model=ContactoOut)
def update_contacto(documento: str, data: ContactoUpdate, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    return upsert_sub(db, MedicoContacto, m.id, data.model_dump())


# ── Prerrogativas ─────────────────────────────────────────────
@router.get("/medicos/{documento}/prerrogativas/", response_model=PrerrogativasOut)
def get_prerrogativas(documento: str, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    obj = db.query(MedicoPrerrogativas).filter(MedicoPrerrogativas.medico_id == m.id).first()
    if not obj:
        raise HTTPException(404, "Sin prerrogativas para este médico")
    return obj


@router.put("/medicos/{documento}/prerrogativas/", response_model=PrerrogativasOut)
def update_prerrogativas(documento: str, data: PrerrogativasUpdate, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    return upsert_sub(db, MedicoPrerrogativas, m.id, data.model_dump())


# ── Diplomas ──────────────────────────────────────────────────
@router.get("/medicos/{documento}/diplomas-verificaciones/", response_model=DiplomasOut)
def get_diplomas(documento: str, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    obj = db.query(MedicoDiplomas).filter(MedicoDiplomas.medico_id == m.id).first()
    if not obj:
        raise HTTPException(404, "Sin diplomas para este médico")
    return obj


@router.put("/medicos/{documento}/diplomas-verificaciones/", response_model=DiplomasOut)
def update_diplomas(documento: str, data: DiplomasUpdate, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    return upsert_sub(db, MedicoDiplomas, m.id, data.model_dump())


# ── Normativos ────────────────────────────────────────────────
@router.get("/medicos/{documento}/normativos/", response_model=NormativosOut)
def get_normativos(documento: str, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    obj = db.query(MedicoNormativos).filter(MedicoNormativos.medico_id == m.id).first()
    if not obj:
        raise HTTPException(404, "Sin normativos para este médico")
    return obj


@router.put("/medicos/{documento}/normativos/", response_model=NormativosOut)
def update_normativos(documento: str, data: NormativosUpdate, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    d = data.model_dump()

    # Calcular estados automáticamente para campos con fecha
    fecha_fields = [
        ("bls_fecha_venc", "bls_estado"),
        ("acls_fecha_venc", "acls_estado"),
        ("pals_fecha_venc", "pals_estado"),
        ("nals_fecha_venc", "nals_estado"),
        ("violencia_sexual_fecha", "violencia_sexual_estado"),
        ("ataques_quimicos_fecha", "ataques_quimicos_estado"),
        ("dengue_fecha", "dengue_estado"),
        ("sedacion_fecha", "sedacion_estado"),
        ("radioproteccion_fecha", "radioproteccion_estado"),
        ("manejo_dolor_fecha", "manejo_dolor_estado"),
        ("iamii_fecha", "iamii_estado"),
        ("gestion_duelo_fecha", "gestion_duelo_estado"),
    ]
    for fecha_key, estado_key in fecha_fields:
        if d.get(fecha_key) is not None:
            d[estado_key] = calcular_estado(d[fecha_key])

    return upsert_sub(db, MedicoNormativos, m.id, d)


# ── Contratación ──────────────────────────────────────────────
@router.get("/medicos/{documento}/contratacion/", response_model=ContratacionOut)
def get_contratacion(documento: str, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    obj = db.query(MedicoContratacion).filter(MedicoContratacion.medico_id == m.id).first()
    if not obj:
        raise HTTPException(404, "Sin contratación para este médico")
    return obj


@router.put("/medicos/{documento}/contratacion/", response_model=ContratacionOut)
def update_contratacion(documento: str, data: ContratacionUpdate, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    return upsert_sub(db, MedicoContratacion, m.id, data.model_dump())


# ── Accesos ───────────────────────────────────────────────────
@router.get("/medicos/{documento}/accesos/", response_model=AccesosOut)
def get_accesos(documento: str, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    obj = db.query(MedicoAccesos).filter(MedicoAccesos.medico_id == m.id).first()
    if not obj:
        raise HTTPException(404, "Sin accesos para este médico")
    return obj


@router.put("/medicos/{documento}/accesos/", response_model=AccesosOut)
def update_accesos(documento: str, data: AccesosUpdate, db: Session = Depends(get_db)):
    m = get_medico_or_404(documento, db)
    return upsert_sub(db, MedicoAccesos, m.id, data.model_dump())


# ── Completitud ───────────────────────────────────────────────
@router.get("/medicos/{documento}/completitud/")
def get_completitud(documento: str, db: Session = Depends(get_db)):
    """Calcula el % de completitud por sección."""
    m = get_medico_or_404(documento, db)

    CAMPOS_REQUERIDOS = {
        "datos_generales": ["categoria", "documento_identidad", "primer_nombre", "primer_apellido"],
        "datos_hv": ["tipo_documento", "lugar_expedicion", "fecha_nacimiento", "sexo"],
        "contacto": ["correo", "celular"],
        "prerrogativas": ["estado_prerrogativas"],
        "diplomas": ["pregrado"],
        "normativos": ["bls_estado", "acls_estado", "tarjeta_rethus"],
        "contratacion": ["tipo_vinculacion"],
        "accesos": ["induccion_medica_fsfb", "estado_codigo"],
    }

    def calc_section(obj, campos):
        if obj is None:
            return 0.0
        filled = sum(1 for c in campos if getattr(obj, c, None) not in (None, "", "PENDIENTE"))
        return round((filled / len(campos)) * 100, 1)

    result = {
        "datos_generales": calc_section(m, CAMPOS_REQUERIDOS["datos_generales"]),
        "datos_hv": calc_section(m.datos_hv, CAMPOS_REQUERIDOS["datos_hv"]),
        "contacto": calc_section(m.contacto, CAMPOS_REQUERIDOS["contacto"]),
        "prerrogativas": calc_section(m.prerrogativas, CAMPOS_REQUERIDOS["prerrogativas"]),
        "diplomas": calc_section(m.diplomas, CAMPOS_REQUERIDOS["diplomas"]),
        "normativos": calc_section(m.normativos, CAMPOS_REQUERIDOS["normativos"]),
        "contratacion": calc_section(m.contratacion, CAMPOS_REQUERIDOS["contratacion"]),
        "accesos": calc_section(m.accesos, CAMPOS_REQUERIDOS["accesos"]),
    }

    values = list(result.values())
    result["global"] = round(sum(values) / len(values), 1) if values else 0.0

    return result
