import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import func as sa_func
from passlib.context import CryptContext
from jose import JWTError, jwt
from pydantic import BaseModel
from database import get_db
from model import User

router = APIRouter(tags=["Auth"])

# ── Configuración ─────────────────────────────────────────────
SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "mediwork-dev-only-key-NO-usar-en-produccion-cambiar-con-JWT_SECRET_KEY"
)
ALGORITHM = "HS256"

# Duración de tokens
ACCESS_TOKEN_EXPIRE_MINUTES = 30      # Usuarios normales: 30 minutos
ACCESS_TOKEN_EXPIRE_ADMIN   = 60 * 8  # Admin: 8 horas (jornada completa)
REFRESH_TOKEN_EXPIRE_HOURS  = 8       # Refresh: 8 horas (cubre toda la jornada)

# Cookie Secure solo en producción HTTPS — configurar en .env
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"

pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# ── Helpers ───────────────────────────────────────────────────
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_token(data: dict, expires_delta: timedelta) -> str:
    payload = {**data, "exp": datetime.utcnow() + expires_delta}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def _user_dict(user: User) -> dict:
    return {
        "id":       user.id,
        "username": user.username,
        "nombre":   user.nombre,
        "email":    user.email,
        "rol":      user.rol,
    }


# ── Dependencia: usuario autenticado ──────────────────────────
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        # Rechazar si es un refresh token usado como access token
        if not username or payload.get("type") == "refresh":
            raise exc
    except JWTError:
        raise exc

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise exc
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return user


def require_roles(*roles: str):
    """Dependencia que verifica el rol del usuario autenticado."""
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.rol not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acción no permitida para el rol '{current_user.rol}'",
            )
        return current_user
    return checker


# ── Schemas ───────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class VerifyCredentialsRequest(BaseModel):
    email: str
    password: str
    required_roles: list[str] = ["admin", "supervisor"]


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/login")
def login(creds: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Autentica al usuario y devuelve:
    - access_token (Bearer, JSON): 30 min usuarios / 8 h admin
    - refresh_token (httpOnly cookie): 8 horas
    """
    email = creds.email.strip().lower()
    user  = db.query(User).filter(sa_func.lower(User.email) == email).first()

    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")

    # Duración del access token según rol
    access_expires = timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_ADMIN if user.rol == "admin"
        else ACCESS_TOKEN_EXPIRE_MINUTES
    )

    access_token  = create_token({"sub": user.username, "rol": user.rol}, access_expires)
    refresh_token = create_token(
        {"sub": user.username, "rol": user.rol, "type": "refresh"},
        timedelta(hours=REFRESH_TOKEN_EXPIRE_HOURS),
    )

    # Refresh token como cookie httpOnly — el browser lo envía automáticamente
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_HOURS * 3600,
        path="/api/v1/auth",   # Solo se envía a rutas de auth
    )

    return {
        "access_token": access_token,
        "token_type":   "bearer",
        "user":         _user_dict(user),
    }


@router.post("/refresh")
def refresh_access_token(
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db),
):
    """
    Emite un nuevo access token usando el refresh_token de la cookie httpOnly.
    El frontend llama este endpoint automáticamente antes o después de un 401.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token no encontrado — inicia sesión nuevamente",
        )
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token expirado o inválido",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    username = payload.get("sub")
    rol      = payload.get("rol")
    if not username:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    # Verificar que el usuario sigue activo
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.activo:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado o inactivo",
        )

    access_expires = timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_ADMIN if rol == "admin"
        else ACCESS_TOKEN_EXPIRE_MINUTES
    )
    new_access_token = create_token({"sub": username, "rol": rol}, access_expires)
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/logout")
def logout(response: Response):
    """Elimina el refresh token de la cookie del navegador."""
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth",
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )
    return {"message": "Sesión cerrada correctamente"}


@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


@router.post("/verify-credentials")
def verify_credentials(creds: VerifyCredentialsRequest, db: Session = Depends(get_db)):
    """
    Valida credenciales y rol sin generar token.
    Usado para confirmar acciones sensibles (desactivar normativos, etc.).
    """
    email = creds.email.strip().lower()
    user  = db.query(User).filter(sa_func.lower(User.email) == email).first()

    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )
    if not user.activo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    if user.rol not in creds.required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Se requiere rol {', '.join(creds.required_roles)}. Tu rol es '{user.rol}'.",
        )

    return {
        "valid": True,
        "user": {"username": user.username, "nombre": user.nombre, "rol": user.rol},
    }
