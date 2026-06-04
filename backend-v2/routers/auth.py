import os
from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from passlib.context import CryptContext
from jose import JWTError, jwt
from database import get_db
from model import User

router = APIRouter(tags=["Auth"])

# ── Configuración de Seguridad ─────────────────────────────────
# SECRET_KEY se lee del entorno. Si no existe (desarrollo local)
# usa un fallback — NUNCA desplegar en producción sin definir esta variable.
# Generar clave segura: python -c "import secrets; print(secrets.token_hex(32))"
SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "mediwork-dev-only-key-NO-usar-en-produccion-cambiar-con-JWT_SECRET_KEY"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8  # 8 horas

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

ACCESS_TOKEN_EXPIRE_ADMIN_DAYS = 30  # admin: 30 días

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return user


def require_roles(*roles: str):
    """Dependencia de FastAPI que verifica el rol del usuario autenticado."""
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acción no permitida para el rol '{current_user.rol}'",
            )
        return current_user
    return checker


from pydantic import BaseModel

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    email = creds.email.strip().lower()
    user = db.query(User).filter(
        sa_func.lower(User.email) == email
    ).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")

    if user.rol == "admin":
        expires = timedelta(days=ACCESS_TOKEN_EXPIRE_ADMIN_DAYS)
    else:
        expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        data={"sub": user.username, "rol": user.rol}, expires_delta=expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id":       user.id,
            "username": user.username,
            "nombre":   user.nombre,
            "email":    user.email,
            "rol":      user.rol,
        },
    }

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id":       current_user.id,
        "username": current_user.username,
        "nombre":   current_user.nombre,
        "email":    current_user.email,
        "rol":      current_user.rol,
    }
