"""
MediWork HSM v2.0 — Modelos SQLAlchemy
9 tablas principales + maestras + audit_log
Basado en prompt_master.txt v2.0
"""
from sqlalchemy import (
    Column, String, Integer, BigInteger, Boolean, Date, Text,
    DateTime, ForeignKey, Numeric, JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ═══════════════════════════════════════════════════════════════
# TABLAS MAESTRAS (origen: hoja Desplegables.xlsx)
# ═══════════════════════════════════════════════════════════════

class Categoria(Base):
    __tablename__ = "categorias"
    code   = Column(String(5), primary_key=True)             # H|I|AE|AP|A|C|E|PE|PSI|N/D|O
    nombre = Column(String(100), nullable=False)


class Departamento(Base):
    __tablename__ = "departamentos"
    id     = Column(String(10), primary_key=True)
    nombre = Column(String(200), nullable=False)
    tipo   = Column(String(20), nullable=False)              # coordinacion|dm|drg


class Seccion(Base):
    __tablename__ = "secciones"
    id     = Column(String(10), primary_key=True)
    nombre = Column(String(200), nullable=False)


class EspecialidadMetrica(Base):
    __tablename__ = "especialidades_metricas"
    nombre = Column(String(200), primary_key=True)


class Ciudad(Base):
    __tablename__ = "ciudades"
    nombre = Column(String(100), primary_key=True)


class CondicionLaboral(Base):
    __tablename__ = "condiciones_laborales"
    condicion = Column(String(100), primary_key=True)


# ═══════════════════════════════════════════════════════════════
# 1. MEDICOS — tabla maestra
# ═══════════════════════════════════════════════════════════════

class Medico(Base):
    __tablename__ = "medicos"

    id                      = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    documento_identidad     = Column(String(20), unique=True, nullable=False, index=True)
    nombre_medico           = Column(String(200), nullable=False)
    primer_nombre           = Column(String(100))
    segundo_nombre          = Column(String(100))
    primer_apellido         = Column(String(100))
    segundo_apellido        = Column(String(100))
    categoria               = Column(String(5), ForeignKey("categorias.code"))
    dept_coordinacion_id    = Column(String(10), ForeignKey("departamentos.id"))
    dept_direccion_medica_id = Column(String(10), ForeignKey("departamentos.id"))
    seccion_id              = Column(String(10), ForeignKey("secciones.id"))
    especialidad            = Column(Text)
    estado                  = Column(String(20), default="ACTIVO")  # ACTIVO|INACTIVO|EN_PROCESO|FINALIZADO|RENUNCIA
    tipo_listado            = Column(String(30))                    # cuerpo_medico|fsfb_externo|inactivo|renuncia|finalizacion
    fecha_ingreso           = Column(Date)
    anios_cuerpo_medico     = Column(Numeric(5, 2))
    # Campos de cambio de estado
    fecha_terminacion           = Column(Date)                      # Fecha efectiva de renuncia
    fecha_inactivacion          = Column(Date)                      # Fecha de traslado a inactivo
    fecha_finalizacion_contrato = Column(Date)                      # Fecha de finalización de contrato
    formulario_autorizacion_datos = Column(Boolean, default=False)  # Ley 1581 — autorización tratamiento datos
    created_at              = Column(DateTime(timezone=True), server_default=func.now())
    updated_at              = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    datos_hv            = relationship("MedicoDatosHV", back_populates="medico", uselist=False)
    contacto            = relationship("MedicoContacto", back_populates="medico", uselist=False)
    prerrogativas       = relationship("MedicoPrerrogativas", back_populates="medico", uselist=False)
    diplomas            = relationship("MedicoDiplomas", back_populates="medico", uselist=False)
    normativos          = relationship("MedicoNormativos", back_populates="medico", uselist=False)
    contratacion        = relationship("MedicoContratacion", back_populates="medico", uselist=False)
    accesos             = relationship("MedicoAccesos", back_populates="medico", uselist=False)
    docs_habilitacion   = relationship("MedicoDocsHabilitacion", back_populates="medico", uselist=False)
    historial_estados   = relationship("HistorialEstados", back_populates="medico", order_by="HistorialEstados.fecha_cambio.desc()")


# ═══════════════════════════════════════════════════════════════
# 2. MEDICOS_DATOS_HV (Carpeta 1 + datos personales)
# ═══════════════════════════════════════════════════════════════

class MedicoDatosHV(Base):
    __tablename__ = "medicos_datos_hv"

    medico_id               = Column(BigInteger, ForeignKey("medicos.id", ondelete="SET NULL"), primary_key=True)
    tipo_documento          = Column(String(5))               # C.C.|C.E.|PA|PEP
    lugar_expedicion        = Column(String(100))
    fecha_nacimiento        = Column(Date)
    lugar_nacimiento        = Column(String(100))
    sexo                    = Column(String(1))               # M|F|O

    # Documentos HV (estado: OK|PENDIENTE|N.A.)
    form_sol_ingreso            = Column(String(20))
    fecha_form_sol_ingreso      = Column(Date)
    form_cap_educacion          = Column(String(20))
    fecha_form_cap              = Column(String(20))
    carta_pres_coord_dpto       = Column(String(20))
    fecha_carta_coord_dpto      = Column(Date)
    carta_pres_coord_seccion    = Column(String(20))
    fecha_carta_coord_sec       = Column(Date)
    carta_aspirante             = Column(String(20))
    fecha_carta_aspirante       = Column(Date)
    carta_recomendacion_1       = Column(String(20))
    fecha_carta_recom1          = Column(Date)
    carta_recomendacion_2       = Column(String(20))
    fecha_carta_recom2          = Column(Date)
    carta_institucionalidad     = Column(String(20))
    carta_cod_conducta          = Column(String(20))
    carta_presentacion_dm       = Column(String(20))
    fecha_presentacion_dm       = Column(Date)
    antecedentes_disciplinarios = Column(String(20))
    antecedentes_judiciales     = Column(String(20))
    otros_docs_ingreso          = Column(Text)

    medico = relationship("Medico", back_populates="datos_hv")


# ═══════════════════════════════════════════════════════════════
# 3. MEDICOS_CONTACTO
# ═══════════════════════════════════════════════════════════════

class MedicoContacto(Base):
    __tablename__ = "medicos_contacto"

    medico_id                = Column(BigInteger, ForeignKey("medicos.id", ondelete="SET NULL"), primary_key=True)
    correo                   = Column(String(200), unique=True)
    celular                  = Column(String(30))
    telefono                 = Column(String(30))
    direccion_correspondencia = Column(Text)
    consultorio_particular   = Column(Boolean)
    direccion_consultorio    = Column(Text)
    estado_civil             = Column(String(1))              # S|C|U|D|V
    tiene_hijos              = Column(Boolean)
    maneja_lengua_senas      = Column(Boolean)
    idiomas                  = Column(JSON)                   # ['Inglés','Francés',...]

    medico = relationship("Medico", back_populates="contacto")


# ═══════════════════════════════════════════════════════════════
# 4. MEDICOS_PRERROGATIVAS (Carpeta 2-3)
# ═══════════════════════════════════════════════════════════════

class MedicoPrerrogativas(Base):
    __tablename__ = "medicos_prerrogativas"

    medico_id                   = Column(BigInteger, ForeignKey("medicos.id", ondelete="SET NULL"), primary_key=True)
    estado_prerrogativas        = Column(String(80))          # 'Prerrogativas Definitivas CME'|...
    fecha_aprobacion_definitivas = Column(Date)

    # Temporales
    pt_solicitud         = Column(String(20))
    pt_fecha_solicitud   = Column(Date)
    pt_respuesta         = Column(String(20))
    pt_fecha_respuesta   = Column(Date)
    pt_fecha_inicio      = Column(Date)
    pt_fecha_fin         = Column(Date)
    pt_notif_coord       = Column(String(20))

    # Ampliación temporales
    amp_pt_solicitud       = Column(String(20))
    amp_pt_fecha_solicitud = Column(Date)
    amp_pt_respuesta       = Column(String(20))
    amp_pt_fecha_inicio    = Column(Date)
    amp_pt_fecha_fin       = Column(Date)

    # Finales
    carta_aut_credenciales      = Column(String(20))
    fecha_carta_aut_cred        = Column(Date)
    carta_aut_ingreso_cme       = Column(String(20))
    fecha_carta_aut_cme         = Column(Date)
    notif_ingreso_profesional   = Column(String(20))
    cert_entrega_modelo_medico  = Column(String(20))
    declaracion_conflicto       = Column(String(20))
    otros_docs_ingreso          = Column(Text)

    medico = relationship("Medico", back_populates="prerrogativas")


# ═══════════════════════════════════════════════════════════════
# 5. MEDICOS_DIPLOMAS (Carpeta 4)
# ═══════════════════════════════════════════════════════════════

class MedicoDiplomas(Base):
    __tablename__ = "medicos_diplomas"

    medico_id                      = Column(BigInteger, ForeignKey("medicos.id", ondelete="SET NULL"), primary_key=True)
    cartas_verificacion            = Column(String(20))
    soporte_verificacion           = Column(String(20))
    fecha_verificacion             = Column(Date)
    pregrado                       = Column(JSON)
    especialidad_1                 = Column(JSON)
    subespecialidad_2              = Column(JSON)
    subespecialidad_3              = Column(JSON)
    otros_estudios                 = Column(JSON)
    certificaciones_entrenamientos = Column(Text)

    medico = relationship("Medico", back_populates="diplomas")


# ═══════════════════════════════════════════════════════════════
# 6. MEDICOS_NORMATIVOS (Carpeta 5 — estado calculado)
# ═══════════════════════════════════════════════════════════════

class MedicoNormativos(Base):
    __tablename__ = "medicos_normativos"

    medico_id                    = Column(BigInteger, ForeignKey("medicos.id", ondelete="SET NULL"), primary_key=True)

    # Con fecha de vencimiento (estado calculado automáticamente)
    bls_fecha_venc               = Column(Date)
    bls_estado                   = Column(String(20))
    acls_fecha_venc              = Column(Date)
    acls_estado                  = Column(String(20))
    pals_fecha_venc              = Column(Date)
    pals_estado                  = Column(String(20))
    nals_fecha_venc              = Column(Date)
    nals_estado                  = Column(String(20))
    violencia_sexual_fecha       = Column(Date)
    violencia_sexual_estado      = Column(String(20))
    ataques_quimicos_fecha       = Column(Date)
    ataques_quimicos_estado      = Column(String(20))
    dengue_fecha                 = Column(Date)
    dengue_estado                = Column(String(20))
    sedacion_fecha               = Column(Date)
    sedacion_estado              = Column(String(20))
    radioproteccion_fecha        = Column(Date)
    radioproteccion_estado       = Column(String(20))
    manejo_dolor_fecha           = Column(Date)
    manejo_dolor_estado          = Column(String(20))
    iamii_fecha                  = Column(Date)
    iamii_estado                 = Column(String(20))
    gestion_duelo_fecha          = Column(Date)
    gestion_duelo_estado         = Column(String(20))
    aiepi_fecha                  = Column(Date)
    aiepi_estado                 = Column(String(20))
    gestion_donante_fecha        = Column(Date)
    gestion_donante_estado       = Column(String(20))
    telemedicina_fecha           = Column(Date)
    telemedicina_estado          = Column(String(20))

    # Sin fecha (estado manual: OK|PENDIENTE|N.A.)
    res_ejercicio                = Column(String(20))
    res_anestesiologo            = Column(String(20))
    tarjeta_rethus               = Column(String(20))
    consulta_rethus              = Column(String(20))
    titulos_rethus               = Column(Text)
    cursos_3_anios               = Column(String(20))
    tarjeta_profesional          = Column(String(20))
    examen_medico                = Column(String(20))

    medico = relationship("Medico", back_populates="normativos")


# ═══════════════════════════════════════════════════════════════
# 7. MEDICOS_CONTRATACION
# ═══════════════════════════════════════════════════════════════

class MedicoContratacion(Base):
    __tablename__ = "medicos_contratacion"

    medico_id                = Column(BigInteger, ForeignKey("medicos.id", ondelete="SET NULL"), primary_key=True)
    tipo_vinculacion         = Column(String(40))
    estado_contrato          = Column(String(20))
    jornada                  = Column(Numeric(3, 2))
    tipo_contrato            = Column(String(30))
    fecha_firma_contrato     = Column(Date)
    condiciones_contrato     = Column(String(80))
    estado_oferta            = Column(String(20))
    tipo_persona             = Column(String(20))
    fecha_firma_oferta       = Column(Date)
    fecha_venc_oferta        = Column(Date)
    modalidad_honorarios     = Column(String(40))
    condiciones_especiales   = Column(Text)
    contrato_prestacion      = Column(String(20))

    medico = relationship("Medico", back_populates="contratacion")


# ═══════════════════════════════════════════════════════════════
# 8. MEDICOS_ACCESOS (inducciones + equipos + pólizas)
# ═══════════════════════════════════════════════════════════════

class MedicoAccesos(Base):
    __tablename__ = "medicos_accesos"

    medico_id               = Column(BigInteger, ForeignKey("medicos.id", ondelete="SET NULL"), primary_key=True)

    # Inducciones: OK|PENDIENTE|N.A.
    induccion_medica_fsfb   = Column(String(20))
    induccion_medica_chsm   = Column(String(20))
    induccion_general_chsm  = Column(String(20))
    induccion_his_isis      = Column(String(20))
    perfil_cargo            = Column(String(20))
    entrenamiento           = Column(String(20))

    # Accesos
    estado_codigo           = Column(String(20))
    codigo_smm              = Column(String(20))
    estado_carnet           = Column(String(20))
    tarjeta_acceso          = Column(String(20))
    estado_bata             = Column(String(20))
    entrega_almera          = Column(String(20))
    entrega_ruaf            = Column(String(20))
    mipres                  = Column(String(20))
    correo_corporativo      = Column(String(20))
    radio_expuesto          = Column(String(20))
    carta_turnos            = Column(String(20))

    # Pólizas
    poliza_resp_civil       = Column(String(20))
    fecha_venc_poliza       = Column(Date)
    poliza_complicaciones   = Column(String(20))

    medico = relationship("Medico", back_populates="accesos")


# ═══════════════════════════════════════════════════════════════
# 9. MEDICOS_DOCS_HABILITACION (Carpeta Habilitación — JSON por doc)
# ═══════════════════════════════════════════════════════════════

class MedicoDocsHabilitacion(Base):
    __tablename__ = "medicos_docs_habilitacion"

    medico_id                   = Column(BigInteger, ForeignKey("medicos.id", ondelete="SET NULL"), primary_key=True)
    # Cada columna JSON: {"codigo", "fecha_expedicion", "fecha_vencimiento", "entidad_expide", "observaciones"}
    rethus                      = Column(JSON)
    tarjeta_profesional         = Column(JSON)
    poliza_responsabilidad      = Column(JSON)
    certificado_especialidad    = Column(JSON)
    examen_medico               = Column(JSON)
    diploma_pregrado            = Column(JSON)
    antecedentes_disciplinarios = Column(JSON)
    antecedentes_judiciales     = Column(JSON)
    contrato_prestacion         = Column(JSON)

    medico = relationship("Medico", back_populates="docs_habilitacion")


# ═══════════════════════════════════════════════════════════════
# 10. HISTORIAL DE ESTADOS
# ═══════════════════════════════════════════════════════════════

class HistorialEstados(Base):
    __tablename__ = "historial_estados"

    id              = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    medico_id       = Column(BigInteger, ForeignKey("medicos.id", ondelete="CASCADE"), nullable=False, index=True)
    estado_anterior = Column(String(30), nullable=False)
    estado_nuevo    = Column(String(30), nullable=False)
    fecha_cambio    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    usuario_cambio  = Column(String(100), nullable=False, default="sistema")
    motivo          = Column(Text)

    medico = relationship("Medico", back_populates="historial_estados")


# ═══════════════════════════════════════════════════════════════
# 11. AUDIT_LOG (Ley 1581)
# ═══════════════════════════════════════════════════════════════

class AuditLog(Base):
    __tablename__ = "audit_log"

    id          = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    medico_id   = Column(BigInteger, ForeignKey("medicos.id", ondelete="SET NULL"))
    action      = Column(String(50), nullable=False)          # read_sensitive|update|delete|login|export
    table_name  = Column(String(50))
    ip_address  = Column(String(45))
    changes     = Column(JSON)                                # {before: {...}, after: {...}}
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

# ═══════════════════════════════════════════════════════════════
# 10. USUARIOS (SISTEMA_LOGIN)
# ═══════════════════════════════════════════════════════════════

class User(Base):
    __tablename__ = "users"
    
    id            = Column(Integer, primary_key=True, index=True)
    username      = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    rol           = Column(String(50), default="user")          # admin | user
    activo        = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
