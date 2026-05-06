#!/bin/sh
set -e

MAX_RETRIES=30
RETRIES=0
echo "[entrypoint] Verificando conexion a la base de datos..."
until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(os.environ['DATABASE_URL'])
    print('DB OK', flush=True)
    sys.exit(0)
except Exception as e:
    print('DB no disponible: ' + str(e), flush=True)
    sys.exit(1)
"; do
  RETRIES=$((RETRIES + 1))
  if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "[entrypoint] ERROR: La base de datos no respondio despues de $MAX_RETRIES intentos."
    exit 1
  fi
  echo "[entrypoint] Reintento $RETRIES/$MAX_RETRIES en 2s..."
  sleep 2
done

echo "[entrypoint] Creando esquema de base de datos..."
python -c "from database import engine; from model import Base; Base.metadata.create_all(bind=engine); print('Esquema OK')"

echo "[entrypoint] Sincronizando migraciones..."
# DB nueva (sin historial alembic) → stamp head (create_all ya aplicó todo)
# DB existente con versión anterior → upgrade head aplica migraciones pendientes
ALEMBIC_CURRENT=$(python -m alembic current 2>&1)
if echo "$ALEMBIC_CURRENT" | grep -qE "[a-f0-9]{8,}"; then
    echo "Revision detectada — aplicando migraciones pendientes..."
    python -m alembic upgrade head
else
    echo "DB nueva — estableciendo revision inicial..."
    python -m alembic stamp head
fi

echo "[entrypoint] Creando usuario admin si no existe..."
python create_admin.py

echo "[entrypoint] Iniciando servidor MediWord v2 en puerto ${PORT:-8001}..."
exec python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8001}"
