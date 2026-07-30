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
    # Sincroniza alembic_version con el estado real del esquema:
    # 1. Elimina revisiones intermedias huérfanas que bloqueen el merge head.
    # 2. Sella el merge head final (g4b7c2d1e805) si el esquema ya lo tiene.
    # 3. Aplica cualquier migración pendiente posterior al merge head.
    python -c "
from database import engine
from sqlalchemy import text

# Head final del árbol de migraciones (merge de c2d5e8f1a607 + f3a8c1d2e904)
MERGE_HEAD = 'g4b7c2d1e805'
# Revisiones intermedias que NO deben coexistir con el merge head
INTERMEDIATE = ['f3a8c1d2e904', 'c2d5e8f1a607']

with engine.connect() as conn:
    current = [r[0] for r in conn.execute(text('SELECT version_num FROM alembic_version')).fetchall()]
    print('[MIGRATION] Revisiones actuales en BD:', current)

    # Si el merge head ya está registrado no hay nada que hacer
    if MERGE_HEAD in current:
        print('[MIGRATION] Merge head ya registrado, nada que sellar.')
    else:
        # Eliminar intermedias que bloqueen el upgrade
        for rev in INTERMEDIATE:
            if rev in current:
                conn.execute(text('DELETE FROM alembic_version WHERE version_num=:r'), {'r': rev})
                conn.commit()
                print('[MIGRATION] Intermedia eliminada:', rev)
        # Sellar merge head
        conn.execute(text('INSERT INTO alembic_version (version_num) VALUES (:r)'), {'r': MERGE_HEAD})
        conn.commit()
        print('[MIGRATION] Merge head sellado:', MERGE_HEAD)
"
    python -m alembic upgrade heads
else
    echo "DB nueva — estableciendo revision inicial..."
    python -m alembic stamp heads
fi

echo "[entrypoint] Creando usuario admin si no existe..."
python create_admin.py

echo "[entrypoint] Aplicando parches de esquema (alter_tables)..."
python alter_tables.py

echo "[entrypoint] Iniciando servidor MediWord v2 en puerto ${PORT:-8001}..."
exec python -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8001}" $UVICORN_ARGS
