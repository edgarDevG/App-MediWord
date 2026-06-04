"""
Router: /api/v1/maestras — Tablas maestras (publicas dentro de sesión)
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from model import Categoria, Departamento, Seccion, EspecialidadMetrica, Ciudad, CondicionLaboral, DirectorioMetrica
from schemas import CategoriaOut, DepartamentoOut, SeccionOut, EspecialidadMetricaOut, CiudadOut, CondicionLaboralOut, DirectorioMetricaOut

router = APIRouter(prefix="/maestras", tags=["Maestras"])


@router.get("/categorias-metricas", response_model=list[CategoriaOut])
@router.get("/categorias-metricas/", response_model=list[CategoriaOut])
def list_categorias(db: Session = Depends(get_db)):
    return db.query(Categoria).order_by(Categoria.code).all()


@router.get("/departamentos", response_model=list[DepartamentoOut])
@router.get("/departamentos/", response_model=list[DepartamentoOut])
def list_departamentos(tipo: str = "", db: Session = Depends(get_db)):
    q = db.query(Departamento)
    if tipo:
        q = q.filter(Departamento.tipo == tipo)
    return q.order_by(Departamento.nombre).all()


@router.get("/secciones", response_model=list[SeccionOut])
@router.get("/secciones/", response_model=list[SeccionOut])
def list_secciones(db: Session = Depends(get_db)):
    return db.query(Seccion).order_by(Seccion.nombre).all()


@router.get("/especialidades", response_model=list[EspecialidadMetricaOut])
@router.get("/especialidades/", response_model=list[EspecialidadMetricaOut])
def list_especialidades(db: Session = Depends(get_db)):
    return db.query(EspecialidadMetrica).order_by(EspecialidadMetrica.nombre).all()


@router.get("/ciudades", response_model=list[CiudadOut])
@router.get("/ciudades/", response_model=list[CiudadOut])
def list_ciudades(db: Session = Depends(get_db)):
    return db.query(Ciudad).order_by(Ciudad.nombre).all()


@router.get("/condiciones-laborales", response_model=list[CondicionLaboralOut])
@router.get("/condiciones-laborales/", response_model=list[CondicionLaboralOut])
def list_condiciones(db: Session = Depends(get_db)):
    return db.query(CondicionLaboral).order_by(CondicionLaboral.condicion).all()


@router.get("/directorio-metrica", response_model=list[DirectorioMetricaOut])
@router.get("/directorio-metrica/", response_model=list[DirectorioMetricaOut])
def list_directorio_metrica(db: Session = Depends(get_db)):
    return db.query(DirectorioMetrica).filter(DirectorioMetrica.activo == True).order_by(DirectorioMetrica.codigo).all()
