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
    op.add_column(
        'medicos_datos_hv',
        sa.Column('fecha_vencimiento_visa', sa.Date(), nullable=True)
    )

def downgrade() -> None:
    op.drop_column('medicos_datos_hv', 'fecha_vencimiento_visa')
