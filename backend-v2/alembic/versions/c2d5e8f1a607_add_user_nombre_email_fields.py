"""add user nombre and email fields

Revision ID: c2d5e8f1a607
Revises: b1c4d7e9f302
Create Date: 2026-05-07

"""
from alembic import op
import sqlalchemy as sa

revision = 'c2d5e8f1a607'
down_revision = 'b1c4d7e9f302'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('nombre', sa.String(200), nullable=True))
    op.add_column('users', sa.Column('email',  sa.String(255), nullable=True))


def downgrade():
    op.drop_column('users', 'email')
    op.drop_column('users', 'nombre')
