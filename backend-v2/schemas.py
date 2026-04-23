"""
MediWork HSM v2.0 — Pydantic schemas
Request/Response models for all endpoints
"""
from pydantic import BaseModel, model_validator
from typing import Optional, List, Any
from datetime import date, datetime


# ═══════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════

def calcular_estado(fecha_vencimiento: Optional[date]) -> Optional[str]:
    """Regla de negocio: estado automático basado en fecha de vencimiento."""
    if fecha_vencimiento is None:
        return None
    delta = (fecha_vencimiento - date.today()).days
    if delta > 30:
        return "OK"
    if delta >= 0:
        return "Por vencer"
    return "Vencido"


# ═══════════════════════════════════════════════════════════════
# MAESTRAS
# ═══════════════════════════════════════════════════════════════

class CategoriaOut(BaseModel):
    code: str
    nombre: str
    model_config = {"from_attributes": True}


class DepartamentoOut(BaseModel):
    id: str
    nombre: str
    tipo: str
    model_config = {"from_attributes": True}


class SeccionOut(BaseModel):
    id: str
    nombre: str
    model_config = {"from_attributes": True}


class EspecialidadMetricaOut(BaseModel):
    nombre: str
    model_config = {"from_attributes": True}


class CiudadOut(BaseModel):
    nombre: str
    model_config = {"from_attributes": True}


class CondicionLaboralOut(BaseModel):
    condicion: str
    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════
# MEDICO — Datos Generales (Tab 1)
# ═══════════════════════════════════════════════════════════════

class MedicoCreate(BaseModel):
    documento_identidad: str
    primer_nombre: str
    primer_apellido: str
    segundo_nombre: Optional[str] = None
    segundo_apellido: Optional[str] = None
    categoria: Optional[str] = None
    dept_coordinacion_id: Optional[str] = None
    dept_direccion_medica_id: Optional[str] = None
    seccion_id: Optional[str] = None
    especialidad: Optional[str] = None
    estado: Optional[str] = "ACTIVO"
    tipo_listado: Optional[str] = "cuerpo_medico"
    fecha_ingreso: Optional[date] = None
    anios_cuerpo_medico: Optional[float] = None

    @model_validator(mode="after")
    def build_nombre_medico(self):
        parts = [self.primer_nombre, self.segundo_nombre, self.primer_apellido, self.segundo_apellido]
        self.nombre_medico = " ".join(p for p in parts if p)
        return self

    nombre_medico: Optional[str] = None


class MedicoUpdate(BaseModel):
    primer_nombre: Optional[str] = None
    segundo_nombre: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    categoria: Optional[str] = None
    dept_coordinacion_id: Optional[str] = None
    dept_direccion_medica_id: Optional[str] = None
    seccion_id: Optional[str] = None
    especialidad: Optional[str] = None
    estado: Optional[str] = None
    tipo_listado: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    anios_cuerpo_medico: Optional[float] = None

class EstadoUpdate(BaseModel):
    nuevoEstado: str                                   # renuncia | inactivo | finalizado
    fechaTerminacion: Optional[date] = None            # obligatorio para renuncia
    fechaInactivacion: Optional[date] = None           # obligatorio/default=hoy para inactivo
    fechaFinalizacionContrato: Optional[date] = None   # obligatorio para finalizado
    formularioAutorizacionDatos: Optional[bool] = None # obligatorio True para finalizado
    direccionCorrespondencia: Optional[str] = None
    direccionConsultorio: Optional[str] = None
    motivo: Optional[str] = None


class HistorialEstadoOut(BaseModel):
    id: int
    medico_id: int
    estado_anterior: str
    estado_nuevo: str
    fecha_cambio: datetime
    usuario_cambio: str
    motivo: Optional[str] = None
    model_config = {"from_attributes": True}


class MedicoOut(BaseModel):
    id: int
    documento_identidad: str
    nombre_medico: str
    primer_nombre: Optional[str] = None
    segundo_nombre: Optional[str] = None
    primer_apellido: Optional[str] = None
    segundo_apellido: Optional[str] = None
    categoria: Optional[str] = None
    dept_coordinacion_id: Optional[str] = None
    dept_direccion_medica_id: Optional[str] = None
    seccion_id: Optional[str] = None
    especialidad: Optional[str] = None
    estado: Optional[str] = None
    tipo_listado: Optional[str] = None
    fecha_ingreso: Optional[date] = None
    anios_cuerpo_medico: Optional[float] = None
    # Campos de cambio de estado
    fecha_terminacion: Optional[date] = None
    fecha_inactivacion: Optional[date] = None
    fecha_finalizacion_contrato: Optional[date] = None
    formulario_autorizacion_datos: Optional[bool] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Campos resueltos (nombres, no IDs)
    seccion_nombre: Optional[str] = None
    dept_coordinacion_nombre: Optional[str] = None
    # Campos enriquecidos para listado (batch join)
    correo: Optional[str] = None
    celular: Optional[str] = None
    tipo_vinculacion: Optional[str] = None
    model_config = {"from_attributes": True}


class MedicoListOut(BaseModel):
    items: List[MedicoOut]
    total: int
    page: int
    size: int


# ═══════════════════════════════════════════════════════════════
# DATOS HV (Tab 1 extended)
# ═══════════════════════════════════════════════════════════════

class DatosHVUpdate(BaseModel):
    tipo_documento: Optional[str] = None
    lugar_expedicion: Optional[str] = None
    fecha_nacimiento: Optional[date] = None
    lugar_nacimiento: Optional[str] = None
    sexo: Optional[str] = None
    form_sol_ingreso: Optional[str] = None
    fecha_form_sol_ingreso: Optional[date] = None
    form_cap_educacion: Optional[str] = None
    fecha_form_cap: Optional[str] = None
    carta_pres_coord_dpto: Optional[str] = None
    fecha_carta_coord_dpto: Optional[date] = None
    carta_pres_coord_seccion: Optional[str] = None
    fecha_carta_coord_sec: Optional[date] = None
    carta_aspirante: Optional[str] = None
    fecha_carta_aspirante: Optional[date] = None
    carta_recomendacion_1: Optional[str] = None
    fecha_carta_recom1: Optional[date] = None
    carta_recomendacion_2: Optional[str] = None
    fecha_carta_recom2: Optional[date] = None
    carta_institucionalidad: Optional[str] = None
    carta_cod_conducta: Optional[str] = None
    carta_presentacion_dm: Optional[str] = None
    fecha_presentacion_dm: Optional[date] = None
    antecedentes_disciplinarios: Optional[str] = None
    antecedentes_judiciales: Optional[str] = None
    otros_docs_ingreso: Optional[str] = None


class DatosHVOut(DatosHVUpdate):
    medico_id: int
    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════
# CONTACTO
# ═══════════════════════════════════════════════════════════════

class ContactoUpdate(BaseModel):
    correo: Optional[str] = None
    celular: Optional[str] = None
    telefono: Optional[str] = None
    direccion_correspondencia: Optional[str] = None
    consultorio_particular: Optional[bool] = None
    direccion_consultorio: Optional[str] = None
    estado_civil: Optional[str] = None
    tiene_hijos: Optional[bool] = None
    maneja_lengua_senas: Optional[bool] = None
    idiomas: Optional[Any] = None


class ContactoOut(ContactoUpdate):
    medico_id: int
    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════
# PRERROGATIVAS
# ═══════════════════════════════════════════════════════════════

class PrerrogativasUpdate(BaseModel):
    estado_prerrogativas: Optional[str] = None
    fecha_aprobacion_definitivas: Optional[date] = None
    pt_solicitud: Optional[str] = None
    pt_fecha_solicitud: Optional[date] = None
    pt_respuesta: Optional[str] = None
    pt_fecha_respuesta: Optional[date] = None
    pt_fecha_inicio: Optional[date] = None
    pt_fecha_fin: Optional[date] = None
    pt_notif_coord: Optional[str] = None
    amp_pt_solicitud: Optional[str] = None
    amp_pt_fecha_solicitud: Optional[date] = None
    amp_pt_respuesta: Optional[str] = None
    amp_pt_fecha_inicio: Optional[date] = None
    amp_pt_fecha_fin: Optional[date] = None
    carta_aut_credenciales: Optional[str] = None
    fecha_carta_aut_cred: Optional[date] = None
    carta_aut_ingreso_cme: Optional[str] = None
    fecha_carta_aut_cme: Optional[date] = None
    notif_ingreso_profesional: Optional[str] = None
    cert_entrega_modelo_medico: Optional[str] = None
    declaracion_conflicto: Optional[str] = None
    otros_docs_ingreso: Optional[str] = None


class PrerrogativasOut(PrerrogativasUpdate):
    medico_id: int
    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════
# DIPLOMAS
# ═══════════════════════════════════════════════════════════════

class DiplomasUpdate(BaseModel):
    cartas_verificacion: Optional[str] = None
    soporte_verificacion: Optional[str] = None
    fecha_verificacion: Optional[date] = None
    pregrado: Optional[Any] = None
    especialidad_1: Optional[Any] = None
    subespecialidad_2: Optional[Any] = None
    subespecialidad_3: Optional[Any] = None
    otros_estudios: Optional[Any] = None
    certificaciones_entrenamientos: Optional[str] = None


class DiplomasOut(DiplomasUpdate):
    medico_id: int
    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════
# NORMATIVOS
# ═══════════════════════════════════════════════════════════════

class NormativosUpdate(BaseModel):
    bls_fecha_venc: Optional[date] = None
    acls_fecha_venc: Optional[date] = None
    pals_fecha_venc: Optional[date] = None
    nals_fecha_venc: Optional[date] = None
    violencia_sexual_fecha: Optional[date] = None
    ataques_quimicos_fecha: Optional[date] = None
    dengue_fecha: Optional[date] = None
    sedacion_fecha: Optional[date] = None
    radioproteccion_fecha: Optional[date] = None
    manejo_dolor_fecha: Optional[date] = None
    iamii_fecha: Optional[date] = None
    gestion_duelo_fecha: Optional[date] = None
    aiepi_fecha: Optional[date] = None
    gestion_donante_fecha: Optional[date] = None
    telemedicina_fecha: Optional[date] = None
    res_ejercicio: Optional[str] = None
    res_anestesiologo: Optional[str] = None
    tarjeta_rethus: Optional[str] = None
    consulta_rethus: Optional[str] = None
    titulos_rethus: Optional[str] = None
    cursos_3_anios: Optional[str] = None
    tarjeta_profesional: Optional[str] = None
    examen_medico: Optional[str] = None


class NormativosOut(NormativosUpdate):
    medico_id: int
    bls_estado: Optional[str] = None
    acls_estado: Optional[str] = None
    pals_estado: Optional[str] = None
    nals_estado: Optional[str] = None
    violencia_sexual_estado: Optional[str] = None
    ataques_quimicos_estado: Optional[str] = None
    dengue_estado: Optional[str] = None
    sedacion_estado: Optional[str] = None
    radioproteccion_estado: Optional[str] = None
    manejo_dolor_estado: Optional[str] = None
    iamii_estado: Optional[str] = None
    gestion_duelo_estado: Optional[str] = None
    aiepi_estado: Optional[str] = None
    gestion_donante_estado: Optional[str] = None
    telemedicina_estado: Optional[str] = None
    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════
# CONTRATACION
# ═══════════════════════════════════════════════════════════════

class ContratacionUpdate(BaseModel):
    tipo_vinculacion: Optional[str] = None
    estado_contrato: Optional[str] = None
    jornada: Optional[float] = None
    tipo_contrato: Optional[str] = None
    fecha_firma_contrato: Optional[date] = None
    condiciones_contrato: Optional[str] = None
    estado_oferta: Optional[str] = None
    tipo_persona: Optional[str] = None
    fecha_firma_oferta: Optional[date] = None
    fecha_venc_oferta: Optional[date] = None
    modalidad_honorarios: Optional[str] = None
    condiciones_especiales: Optional[str] = None
    contrato_prestacion: Optional[str] = None


class ContratacionOut(ContratacionUpdate):
    medico_id: int
    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════
# ACCESOS
# ═══════════════════════════════════════════════════════════════

class AccesosUpdate(BaseModel):
    induccion_medica_fsfb: Optional[str] = None
    induccion_medica_chsm: Optional[str] = None
    induccion_general_chsm: Optional[str] = None
    induccion_his_isis: Optional[str] = None
    perfil_cargo: Optional[str] = None
    entrenamiento: Optional[str] = None
    estado_codigo: Optional[str] = None
    codigo_smm: Optional[str] = None
    estado_carnet: Optional[str] = None
    tarjeta_acceso: Optional[str] = None
    estado_bata: Optional[str] = None
    entrega_almera: Optional[str] = None
    entrega_ruaf: Optional[str] = None
    mipres: Optional[str] = None
    correo_corporativo: Optional[str] = None
    radio_expuesto: Optional[str] = None
    carta_turnos: Optional[str] = None
    poliza_resp_civil: Optional[str] = None
    fecha_venc_poliza: Optional[date] = None
    poliza_complicaciones: Optional[str] = None


class AccesosOut(AccesosUpdate):
    medico_id: int
    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════
# DOCS HABILITACIÓN (Tab 3 — tabla propia JSON por documento)
# ═══════════════════════════════════════════════════════════════

class DocHabItem(BaseModel):
    """Estructura JSON almacenada por cada documento de habilitación."""
    codigo: Optional[str] = None
    fecha_expedicion: Optional[date] = None
    fecha_vencimiento: Optional[date] = None
    entidad_expide: Optional[str] = None
    observaciones: Optional[str] = None
    model_config = {"from_attributes": True}


class DocsHabilitacionUpdate(BaseModel):
    rethus:                      Optional[Any] = None
    tarjeta_profesional:         Optional[Any] = None
    poliza_responsabilidad:      Optional[Any] = None
    certificado_especialidad:    Optional[Any] = None
    examen_medico:               Optional[Any] = None
    diploma_pregrado:            Optional[Any] = None
    antecedentes_disciplinarios: Optional[Any] = None
    antecedentes_judiciales:     Optional[Any] = None
    contrato_prestacion:         Optional[Any] = None


class DocsHabilitacionOut(DocsHabilitacionUpdate):
    medico_id: int
    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════════
# DASHBOARD
# ═══════════════════════════════════════════════════════════════

class DashboardResumen(BaseModel):
    totales: dict
    por_categoria: list