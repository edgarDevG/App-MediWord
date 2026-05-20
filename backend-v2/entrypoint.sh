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
# DB nueva  → stamp heads (create_all ya aplicó todo el esquema)
# DB existente → sellar ramas no rastreadas (creadas por create_all) y luego upgrade heads
ALEMBIC_CURRENT=$(python -m alembic current 2>&1)
if echo "$ALEMBIC_CURRENT" | grep -qE "[a-f0-9]{8,}"; then
    echo "Revision detectada — sellando ramas y aplicando pendientes..."
    # Inserta en alembic_version cualquier branch head que create_all haya
    # creado sin que Alembic lo haya registrado explícitamente.
    python -c "
from database import engine
from sqlalchemy import text
BRANCH_HEADS = ['f3a8c1d2e904']
with engine.connect() as conn:
    for rev in BRANCH_HEADS:
        row = conn.execute(text(\"SELECT version_num FROM alembic_version WHERE version_num=:r\"), {\"r\": rev}).fetchone()
        if not row:
            conn.execute(text(\"INSERT INTO alembic_version (version_num) VALUES (:r)\"), {\"r\": rev})
            conn.commit()
            print('[MIGRATION] Branch sellado:', rev)
"
    python -m alembic upgrade heads
else
    echo "DB nueva — estableciendo revision inicial..."
    python -m alembic stamp heads
fi

echo "[entrypoint] Creando usuario admin si no existe..."
python create_admin.py

echo "[entrypoint] Iniciando servidor MediWord v2 en puerto ${PORT:-8001}..."
exec python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8001}"
