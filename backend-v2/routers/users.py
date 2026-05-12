"""
Router: /api/v1/users — Gestión de usuarios del sistema (solo admin)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from model import User
from routers.auth import get_password_hash, require_roles
from schemas import UserOut, UserCreate, UserUpdate, PasswordReset, ROLES_VALIDOS

router = APIRouter(tags=["Usuarios"])

_ADMIN_ONLY = require_roles("admin")


@router.get("/users/", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(_ADMIN_ONLY),
):
    return db.query(User).order_by(User.id).all()


@router.post("/users/", response_model=UserOut, status_code=201)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(_ADMIN_ONLY),
):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "El nombre de usuario ya existe")
    if data.rol not in ROLES_VALIDOS:
        raise HTTPException(400, f"Rol inválido. Usa: {', '.join(sorted(ROLES_VALIDOS))}")
    user = User(
        username=data.username,
        hashed_password=get_password_hash(data.password),
        nombre=data.nombre,
        email=data.email,
        rol=data.rol,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(_ADMIN_ONLY),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if user_id == current_user.id and data.activo is False:
        raise HTTPException(400, "No puedes desactivarte a ti mismo")
    if data.rol is not None and data.rol not in ROLES_VALIDOS:
        raise HTTPException(400, f"Rol inválido. Usa: {', '.join(sorted(ROLES_VALIDOS))}")
    if data.nombre  is not None: user.nombre = data.nombre
    if data.email   is not None: user.email  = data.email
    if data.rol     is not None: user.rol    = data.rol
    if data.activo  is not None: user.activo = data.activo
    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/reset-password")
def reset_password(
    user_id: int,
    data: PasswordReset,
    db: Session = Depends(get_db),
    _: User = Depends(_ADMIN_ONLY),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "Usuario no encontrado")
    if not data.nueva_password or len(data.nueva_password) < 6:
        raise HTTPException(400, "La contraseña debe tener al menos 6 caracteres")
    user.hashed_password = get_password_hash(data.nueva_password)
    db.commit()
    return {"mensaje": "Contraseña restablecida correctamente"}
