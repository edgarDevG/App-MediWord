"""fix tipo_listado corruption — restore origin type

Revision ID: b1c4d7e9f302
Revises: a3f9c2e8d501
Create Date: 2026-05-06

Problema: patch_medico_estado sobreescribía tipo_listado con valores de ciclo de vida
('renuncia', 'inactivo', 'finalizacion') destruyendo el origen real del médico.
Este script restaura esos registros a 'cuerpo_medico' como valor por defecto.

ANTES DE EJECUTAR: revisar manualmente si algún registro corrompido debería ser
'fsfb_externo' en lugar de 'cuerpo_medico' y corregirlo primero en la DB.
"""
from alembic import op


revision = 'b1c4d7e9f302'
down_revision = 'a3f9c2e8d501'
branch_labels = None
depends_on = None


def upgrade():
    op.execute("""
        UPDATE medicos
        SET tipo_listado = 'cuerpo_medico'
        WHERE tipo_listado IN ('renuncia', 'inactivo', 'finalizacion')
    """)


def downgrade():
    # No es reversible sin conocer el valor original de cada registro.
    pass
