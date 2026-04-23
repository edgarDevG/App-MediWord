"""add_estado_fields_and_historial_estados

Revision ID: 70bf1f1138c9
Revises: de0b45713fe3
Create Date: 2026-04-22 10:19:53.910953

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '70bf1f1138c9'
down_revision: Union[str, Sequence[str], None] = 'de0b45713fe3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'audit_log',
        sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('medico_id', sa.BigInteger(), nullable=True),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('table_name', sa.String(50), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('changes', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.ForeignKeyConstraint(['medico_id'], ['medicos.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_audit_log_id'), 'audit_log', ['id'], unique=False)

    op.add_column('medicos', sa.Column('fecha_terminacion', sa.Date(), nullable=True))
    op.add_column('medicos', sa.Column('fecha_inactivacion', sa.Date(), nullable=True))
    op.add_column('medicos', sa.Column('fecha_finalizacion_contrato', sa.Date(), nullable=True))
    op.add_column('medicos', sa.Column('formulario_autorizacion_datos', sa.Boolean(), nullable=True))


def downgrade() -> None:
    op.drop_column('medicos', 'formulario_autorizacion_datos')
    op.drop_column('medicos', 'fecha_finalizacion_contrato')
    op.drop_column('medicos', 'fecha_inactivacion')
    op.drop_column('medicos', 'fecha_terminacion')
    op.drop_index(op.f('ix_audit_log_id'), table_name='audit_log')
    op.drop_table('audit_log')
