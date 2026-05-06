"""add_directorio_metrica_cargo_contacto_fields

Revision ID: a3f9c2e8d501
Revises: 70bf1f1138c9
Create Date: 2026-04-28 00:00:00.000000

Cambios incluidos:
  - NUEVA tabla maestra: m_directorio_metrica
  - medicos: cargo (VARCHAR 150), directorio_metrica_id (FK)
  - medicos_contacto: correo_corporativo (VARCHAR 200), otro_idioma (VARCHAR 100)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'a3f9c2e8d501'
down_revision: Union[str, Sequence[str], None] = '70bf1f1138c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()

    # ── 1. Tabla maestra directorio_metrica (IF NOT EXISTS) ──────
    conn.execute(sa.text("""
        CREATE TABLE IF NOT EXISTS m_directorio_metrica (
            id          SERIAL       PRIMARY KEY,
            codigo      VARCHAR(20)  NOT NULL,
            descripcion VARCHAR(200) NOT NULL,
            activo      BOOLEAN      NOT NULL DEFAULT true
        )
    """))
    conn.execute(sa.text("""
        CREATE UNIQUE INDEX IF NOT EXISTS uq_directorio_metrica_codigo
        ON m_directorio_metrica (codigo)
    """))

    # ── 2. Tabla medicos: cargo + FK directorio_metrica_id ───────
    conn.execute(sa.text(
        "ALTER TABLE medicos ADD COLUMN IF NOT EXISTS cargo VARCHAR(150)"
    ))
    conn.execute(sa.text(
        "ALTER TABLE medicos ADD COLUMN IF NOT EXISTS directorio_metrica_id INTEGER"
    ))
    # FK solo si no existe ya
    conn.execute(sa.text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_medicos_directorio_metrica'
                  AND table_name = 'medicos'
            ) THEN
                ALTER TABLE medicos
                ADD CONSTRAINT fk_medicos_directorio_metrica
                FOREIGN KEY (directorio_metrica_id)
                REFERENCES m_directorio_metrica(id);
            END IF;
        END$$
    """))

    # ── 3. Tabla medicos_contacto: correo_corporativo + otro_idioma
    conn.execute(sa.text(
        "ALTER TABLE medicos_contacto ADD COLUMN IF NOT EXISTS correo_corporativo VARCHAR(200)"
    ))
    conn.execute(sa.text(
        "ALTER TABLE medicos_contacto ADD COLUMN IF NOT EXISTS otro_idioma VARCHAR(100)"
    ))


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(sa.text("ALTER TABLE medicos_contacto DROP COLUMN IF EXISTS otro_idioma"))
    conn.execute(sa.text("ALTER TABLE medicos_contacto DROP COLUMN IF EXISTS correo_corporativo"))
    conn.execute(sa.text("ALTER TABLE medicos DROP CONSTRAINT IF EXISTS fk_medicos_directorio_metrica"))
    conn.execute(sa.text("ALTER TABLE medicos DROP COLUMN IF EXISTS directorio_metrica_id"))
    conn.execute(sa.text("ALTER TABLE medicos DROP COLUMN IF EXISTS cargo"))
    conn.execute(sa.text("DROP INDEX IF EXISTS uq_directorio_metrica_codigo"))
    conn.execute(sa.text("DROP TABLE IF EXISTS m_directorio_metrica"))
