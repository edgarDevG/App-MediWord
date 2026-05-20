"""add fecha_vencimiento_visa to medicos_datos_hv

Revision ID: g4b7c2d1e805
Revises: f3a8c1d2e904
Create Date: 2026-05-13

"""
from alembic import op
import sqlalchemy as sa

revision = 'g4b7c2d1e805'
# Merge de dos branches: rama principal (c2d5e8f1a607) y rama archivos (f3a8c1d2e904)
down_revision = ('c2d5e8f1a607', 'f3a8c1d2e904')
branch_labels = None
depends_on = None

def upgrade() -> None:
    # IF NOT EXISTS porque run_column_migrations() puede haberla creado antes
    op.execute(
        "ALTER TABLE medicos_datos_hv ADD COLUMN IF NOT EXISTS fecha_vencimiento_visa DATE"
    )

def downgrade() -> None:
    op.drop_column('medicos_datos_hv', 'fecha_vencimiento_visa')
