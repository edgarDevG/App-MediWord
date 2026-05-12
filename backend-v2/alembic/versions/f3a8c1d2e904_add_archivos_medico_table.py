"""add_archivos_medico_table

Revision ID: f3a8c1d2e904
Revises: 70bf1f1138c9
Create Date: 2026-05-12 00:00:00.000000

Crea la tabla archivos_medico para el repositorio documental
por carpeta de cada médico (15 carpetas según marcación HSM).
También agrega fecha_vencimiento_visa a medicos_datos_hv y
dos columnas de fecha de vencimiento a medicos_normativos para
Resol. ejercicio y Resol. anestesiólogo.
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f3a8c1d2e904'
down_revision = '70bf1f1138c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Tabla principal archivos_medico ──────────────────────
    op.create_table(
        'archivos_medico',
        sa.Column('id',                 sa.BigInteger(),    primary_key=True, autoincrement=True),
        sa.Column('medico_id',          sa.BigInteger(),    sa.ForeignKey('medicos.id', ondelete='CASCADE'), nullable=False),
        sa.Column('carpeta',            sa.String(60),      nullable=False),
        sa.Column('subcarpeta',         sa.String(100),     nullable=True),
        sa.Column('tipo_doc',           sa.String(150),     nullable=True),
        sa.Column('campo_ref',          sa.String(100),     nullable=True),
        sa.Column('nombre_original',    sa.String(255),     nullable=False),
        sa.Column('nombre_almacenado',  sa.String(255),     nullable=False),
        sa.Column('ruta_relativa',      sa.String(500),     nullable=False),
        sa.Column('tamano_bytes',       sa.BigInteger(),    nullable=True),
        sa.Column('mime_type',          sa.String(100),     nullable=True, server_default='application/pdf'),
        sa.Column('subido_por',         sa.String(100),     nullable=True),
        sa.Column('fecha_subida',       sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('activo',             sa.Boolean(),       nullable=False, server_default='true'),
    )
    op.create_index('ix_archivos_medico_medico_id', 'archivos_medico', ['medico_id'])
    op.create_index('ix_archivos_medico_carpeta',   'archivos_medico', ['carpeta'])

    # ── 2. fecha_vencimiento_visa en medicos_datos_hv ──────────
    op.add_column(
        'medicos_datos_hv',
        sa.Column('fecha_vencimiento_visa', sa.Date(), nullable=True)
    )

    # ── 3. Fechas vencimiento resoluciones en medicos_normativos
    op.add_column(
        'medicos_normativos',
        sa.Column('res_ejercicio_fecha_venc',     sa.Date(), nullable=True)
    )
    op.add_column(
        'medicos_normativos',
        sa.Column('res_anestesiologo_fecha_venc', sa.Date(), nullable=True)
    )

    # ── 4. fecha_aprobada ampliación PT en medicos_prerrogativas
    op.add_column(
        'medicos_prerrogativas',
        sa.Column('amp_pt_fecha_aprobada', sa.Date(), nullable=True)
    )

    # ── 5. carta_recepcion_docs faltaba en el modelo original ──
    # (campo que ya se usa en Tab2 pero faltaba en schema DB)
    try:
        op.add_column(
            'medicos_prerrogativas',
            sa.Column('carta_recepcion_docs', sa.String(20), nullable=True)
        )
    except Exception:
        pass  # ya existe en algunos entornos


def downgrade() -> None:
    op.drop_index('ix_archivos_medico_carpeta',   table_name='archivos_medico')
    op.drop_index('ix_archivos_medico_medico_id', table_name='archivos_medico')
    op.drop_table('archivos_medico')
    op.drop_column('medicos_datos_hv',     'fecha_vencimiento_visa')
    op.drop_column('medicos_normativos',   'res_ejercicio_fecha_venc')
    op.drop_column('medicos_normativos',   'res_anestesiologo_fecha_venc')
    op.drop_column('medicos_prerrogativas','amp_pt_fecha_aprobada')
