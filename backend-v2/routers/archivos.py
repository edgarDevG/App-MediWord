"""
MediWork HSM v2.0 — Router: Archivos Médicos
Almacenamiento local con estructura de carpetas HSM.

Endpoints:
  POST   /medicos/{documento}/archivos/          — Subir archivo
  GET    /medicos/{documento}/archivos/           — Listar archivos (filtro ?carpeta=)
  GET    /medicos/{documento}/archivos/{id}/      — Detalle de un archivo
  DELETE /medicos/{documento}/archivos/{id}/      — Eliminación lógica
  GET    /medicos/{documento}/archivos/{id}/file  — Descargar/servir el archivo físico
"""

import os
import uuid
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from model import Medico, ArchivoMedico, CARPETAS_VALIDAS
from routers.auth import get_current_user, require_roles

# ── Configuración ──────────────────────────────────────────────────────────────
# Ruta base donde se almacenan los archivos físicos.
# Relativa al directorio del backend; ajustar con variable de entorno si se despliega.
_BASE_DIR = Path(__file__).resolve().parent.parent  # /backend-v2/
MEDIA_ROOT: Path = Path(os.getenv("MEDIA_ROOT", str(_BASE_DIR / "uploads" / "medicos")))

MAX_FILE_SIZE_MB = 50
ALLOWED_MIME_TYPES = {"application/pdf"}

router = APIRouter(tags=["archivos"])

_EDITORS     = require_roles("admin", "supervisor", "editor")
_SUPERVISORS = require_roles("admin", "supervisor")


# ── ENDPOINT TEMPORAL DE DIAGNÓSTICO (ELIMINAR DESPUÉS DE RESOLVER) ───────────
@router.get("/debug/storage", tags=["debug"])
def debug_storage():
    """Diagnóstico temporal del volumen de almacenamiento. ELIMINAR después de resolver."""
    import subprocess
    info = {}

    # 1. MEDIA_ROOT configurado
    info["media_root"] = str(MEDIA_ROOT)
    info["media_root_exists"] = MEDIA_ROOT.exists()
    info["media_root_is_dir"] = MEDIA_ROOT.is_dir()

    # 2. Contenido de la raíz
    try:
        contenido = os.listdir(MEDIA_ROOT)
        info["contenido_raiz"] = contenido[:50]
        info["total_items"] = len(contenido)
    except Exception as e:
        info["contenido_raiz_error"] = str(e)

    # 3. Información de montaje (¿es CIFS/SAMBA o local?)
    try:
        result = subprocess.run(
            ["findmnt", "-T", str(MEDIA_ROOT), "-o", "SOURCE,FSTYPE,TARGET,OPTIONS", "--json"],
            capture_output=True, text=True, timeout=5
        )
        info["mount_info"] = result.stdout.strip() if result.returncode == 0 else f"findmnt error: {result.stderr.strip()}"
    except FileNotFoundError:
        # Si findmnt no existe, intentar con mount | grep
        try:
            result = subprocess.run(
                ["mount"], capture_output=True, text=True, timeout=5
            )
            lineas_relevantes = [l for l in result.stdout.splitlines() if "uploads" in l or "cifs" in l or "medicos" in l]
            info["mount_info"] = lineas_relevantes if lineas_relevantes else "No se encontró montaje CIFS/SAMBA para uploads"
        except Exception as e2:
            info["mount_info"] = f"Error ejecutando mount: {e2}"
    except Exception as e:
        info["mount_info"] = f"Error: {e}"

    # 4. Permisos y propietario
    try:
        stat = os.stat(MEDIA_ROOT)
        info["permisos"] = oct(stat.st_mode)
        info["uid"] = stat.st_uid
        info["gid"] = stat.st_gid
    except Exception as e:
        info["permisos_error"] = str(e)

    # 5. Prueba de escritura
    test_file = MEDIA_ROOT / "__test_samba_write__.tmp"
    try:
        test_file.write_text("test")
        info["escritura_ok"] = True
        test_file.unlink()
    except Exception as e:
        info["escritura_error"] = str(e)

    # 6. /proc/mounts para ver montajes reales
    try:
        with open("/proc/mounts", "r") as f:
            mounts = f.read()
        cifs_mounts = [l for l in mounts.splitlines() if "cifs" in l or "uploads" in l]
        info["proc_mounts_cifs"] = cifs_mounts if cifs_mounts else "NO HAY MONTAJES CIFS - El volumen NO está conectado a SAMBA"
    except Exception as e:
        info["proc_mounts_error"] = str(e)

    # 7. Variables de entorno relevantes
    info["env_MEDIA_ROOT"] = os.getenv("MEDIA_ROOT", "NO DEFINIDA")
    info["env_DATABASE_URL_exists"] = bool(os.getenv("DATABASE_URL"))

    return info


# ── Schemas Pydantic ──────────────────────────────────────────────────────────

class ArchivoOut(BaseModel):
    id: int
    medico_id: int
    carpeta: str
    subcarpeta: Optional[str]
    tipo_doc: Optional[str]
    campo_ref: Optional[str]
    nombre_original: str
    nombre_almacenado: str
    tamano_bytes: Optional[int]
    mime_type: Optional[str]
    subido_por: Optional[str]
    fecha_subida: datetime
    activo: bool
    url_descarga: Optional[str] = None

    class Config:
        from_attributes = True


# ── Helpers ────────────────────────────────────────────────────────────────────

def _get_medico_or_404(documento: str, db: Session) -> Medico:
    m = db.query(Medico).filter(Medico.documento_identidad == documento).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Médico '{documento}' no encontrado")
    return m


def _get_archivo_or_404(archivo_id: int, medico_id: int, db: Session) -> ArchivoMedico:
    a = (
        db.query(ArchivoMedico)
        .filter(
            ArchivoMedico.id == archivo_id,
            ArchivoMedico.medico_id == medico_id,
            ArchivoMedico.activo == True,
        )
        .first()
    )
    if not a:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return a


def _safe_filename(nombre: str) -> str:
    """Elimina caracteres peligrosos del nombre de archivo."""
    nombre = nombre.strip()
    nombre = re.sub(r"[^\w\s\-\.áéíóúÁÉÍÓÚñÑ]", "_", nombre)
    nombre = re.sub(r"\s+", " ", nombre)
    return nombre[:200] if len(nombre) > 200 else nombre


def _build_nombre_almacenado(nombre_original: str) -> str:
    """
    Genera nombre en disco: YYYYMMDD_<uuid4_short>_<nombre_seguro>
    Ejemplo: 20260512_a3f8b1c2_Cédula.pdf
    """
    hoy = datetime.now().strftime("%Y%m%d")
    uid = uuid.uuid4().hex[:8]
    safe = _safe_filename(nombre_original)
    return f"{hoy}_{uid}_{safe}"


def _build_ruta(documento: str, carpeta: str) -> Path:
    """Retorna (y crea si no existe) la ruta física de almacenamiento."""
    ruta = MEDIA_ROOT / documento / carpeta
    ruta.mkdir(parents=True, exist_ok=True)
    return ruta


def _archivo_to_out(archivo: ArchivoMedico, documento: str) -> ArchivoOut:
    data = ArchivoOut.model_validate(archivo)
    data.url_descarga = f"/medicos/{documento}/archivos/{archivo.id}/file"
    return data


# ── POST /medicos/{documento}/archivos/ ────────────────────────────────────────

@router.post(
    "/medicos/{documento}/archivos/",
    response_model=ArchivoOut,
    status_code=201,
    summary="Subir archivo adjunto a un médico",
)
async def upload_archivo(
    documento: str,
    carpeta: str = Form(..., description="Carpeta destino (una de CARPETAS_VALIDAS)"),
    archivo: UploadFile = File(...),
    tipo_doc: Optional[str] = Form(None, description="Tipo de documento (ej: Cédula, BLS)"),
    campo_ref: Optional[str] = Form(None, description="Campo del formulario origen"),
    subcarpeta: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user=Depends(_EDITORS),
):
    # Validar carpeta
    if carpeta not in CARPETAS_VALIDAS:
        raise HTTPException(
            status_code=422,
            detail=f"Carpeta '{carpeta}' no válida. Carpetas permitidas: {sorted(CARPETAS_VALIDAS)}",
        )

    # Validar médico
    medico = _get_medico_or_404(documento, db)

    # Validar MIME (PDF únicamente)
    if archivo.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=422,
            detail="Solo se permiten archivos PDF (application/pdf)",
        )

    # Leer contenido y validar tamaño
    contenido = await archivo.read()
    tamano = len(contenido)
    if tamano > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"El archivo supera el límite de {MAX_FILE_SIZE_MB} MB",
        )

    # Construir nombres y rutas
    nombre_original = archivo.filename or "documento.pdf"
    nombre_almacenado = _build_nombre_almacenado(nombre_original)
    ruta_dir = _build_ruta(documento, carpeta)
    ruta_fisica = ruta_dir / nombre_almacenado
    ruta_relativa = str(Path(documento) / carpeta / nombre_almacenado)

    # Escribir en disco
    try:
        ruta_fisica.write_bytes(contenido)
    except OSError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al guardar el archivo en disco: {e}",
        )

    # Registrar en BD
    registro = ArchivoMedico(
        medico_id=medico.id,
        carpeta=carpeta,
        subcarpeta=subcarpeta,
        tipo_doc=tipo_doc,
        campo_ref=campo_ref,
        nombre_original=nombre_original,
        nombre_almacenado=nombre_almacenado,
        ruta_relativa=ruta_relativa,
        tamano_bytes=tamano,
        mime_type=archivo.content_type,
        subido_por=current_user.username if hasattr(current_user, "username") else None,
        activo=True,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)

    return _archivo_to_out(registro, documento)


# ── GET /medicos/{documento}/archivos/ ─────────────────────────────────────────

@router.get(
    "/medicos/{documento}/archivos/",
    response_model=list[ArchivoOut],
    summary="Listar archivos adjuntos de un médico",
)
def list_archivos(
    documento: str,
    carpeta: Optional[str] = Query(None, description="Filtrar por carpeta"),
    campo_ref: Optional[str] = Query(None, description="Filtrar por campo_ref"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    medico = _get_medico_or_404(documento, db)

    q = db.query(ArchivoMedico).filter(
        ArchivoMedico.medico_id == medico.id,
        ArchivoMedico.activo == True,
    )
    if carpeta:
        q = q.filter(ArchivoMedico.carpeta == carpeta)
    if campo_ref:
        q = q.filter(ArchivoMedico.campo_ref == campo_ref)

    archivos = q.order_by(ArchivoMedico.fecha_subida.desc()).all()
    return [_archivo_to_out(a, documento) for a in archivos]


# ── GET /medicos/{documento}/archivos/{id}/ ────────────────────────────────────

@router.get(
    "/medicos/{documento}/archivos/{archivo_id}/",
    response_model=ArchivoOut,
    summary="Detalle de un archivo adjunto",
)
def get_archivo(
    documento: str,
    archivo_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    medico = _get_medico_or_404(documento, db)
    archivo = _get_archivo_or_404(archivo_id, medico.id, db)
    return _archivo_to_out(archivo, documento)


# ── GET /medicos/{documento}/archivos/{id}/file ────────────────────────────────

@router.get(
    "/medicos/{documento}/archivos/{archivo_id}/file",
    summary="Servir/descargar el archivo físico",
)
def download_archivo(
    documento: str,
    archivo_id: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    medico = _get_medico_or_404(documento, db)
    archivo = _get_archivo_or_404(archivo_id, medico.id, db)

    ruta_fisica = MEDIA_ROOT / archivo.ruta_relativa
    if not ruta_fisica.exists():
        import os
        try:
            contenido_dir = str(os.listdir(MEDIA_ROOT))[:200]
        except Exception as e:
            contenido_dir = f"Error leyendo {MEDIA_ROOT}: {e}"
            
        raise HTTPException(
            status_code=404,
            detail=f"Archivo no encontrado. Buscando en: {ruta_fisica}. Archivos en la raíz: {contenido_dir}",
        )

    return FileResponse(
        path=str(ruta_fisica),
        media_type=archivo.mime_type or "application/pdf",
        filename=archivo.nombre_original,
    )


# ── DELETE /medicos/{documento}/archivos/{id}/ ─────────────────────────────────

@router.delete(
    "/medicos/{documento}/archivos/{archivo_id}/",
    status_code=204,
    summary="Eliminación lógica de un archivo adjunto",
)
def delete_archivo(
    documento: str,
    archivo_id: int,
    db: Session = Depends(get_db),
    _=Depends(_EDITORS),
):
    medico = _get_medico_or_404(documento, db)
    archivo = _get_archivo_or_404(archivo_id, medico.id, db)

    archivo.activo = False
    db.commit()
    # Nota: el archivo físico se conserva en disco (eliminación lógica).
    # Para purga física programada, usar un job de mantenimiento 