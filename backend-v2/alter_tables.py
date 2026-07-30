from database import engine
from sqlalchemy import text

def run(label, sql):
    """Ejecuta cada ALTER en su propia conexión/transacción."""
    try:
        with engine.connect() as conn:
            conn.execute(text(sql))
            conn.commit()
        print(f"  OK  {label}")
    except Exception as e:
        print(f"  --  {label}: {e}")

def apply_alters():
    print("=== alter_tables START ===")

    # ── medicos_datos_hv ─────────────────────────────────────────
    run("datos_hv antecedentes_disciplinarios",
        "ALTER TABLE medicos_datos_hv ADD COLUMN IF NOT EXISTS antecedentes_disciplinarios VARCHAR(20)")
    run("datos_hv antecedentes_judiciales",
        "ALTER TABLE medicos_datos_hv ADD COLUMN IF NOT EXISTS antecedentes_judiciales VARCHAR(20)")

    # ── medicos_normativos ────────────────────────────────────────
    for col, typ in [
        ("tarjeta_profesional", "VARCHAR(20)"), ("examen_medico",  "VARCHAR(20)"),
        ("aiepi_fecha", "DATE"), ("aiepi_estado", "VARCHAR(20)"),
        ("gestion_donante_fecha", "DATE"), ("gestion_donante_estado", "VARCHAR(20)"),
        ("telemedicina_fecha", "DATE"), ("telemedicina_estado", "VARCHAR(20)"),
    ]:
        run(f"normativos {col}", f"ALTER TABLE medicos_normativos ADD COLUMN IF NOT EXISTS {col} {typ}")

    # ── medicos_contratacion ──────────────────────────────────────
    run("contratacion contrato_prestacion",
        "ALTER TABLE medicos_contratacion ADD COLUMN IF NOT EXISTS contrato_prestacion VARCHAR(20)")

    # ── medicos_prerrogativas ──────────────────────────────────────
    run("prerrogativas carta_recepcion_docs",
        "ALTER TABLE medicos_prerrogativas ADD COLUMN IF NOT EXISTS carta_recepcion_docs VARCHAR(20)")

    # ── m_directorio_metrica: añadir id PK + activo ───────────────
    # La tabla ya existe con 128 filas (codigo, descripcion) pero sin PK ni id
    run("m_directorio_metrica ADD id",
        "ALTER TABLE m_directorio_metrica ADD COLUMN IF NOT EXISTS id SERIAL")
    run("m_directorio_metrica SET PK",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE table_name='m_directorio_metrica' AND constraint_type='PRIMARY KEY'
            ) THEN
                ALTER TABLE m_directorio_metrica ADD PRIMARY KEY (id);
            END IF;
        END$$
        """)
    run("m_directorio_metrica ADD activo",
        "ALTER TABLE m_directorio_metrica ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT true")
    run("m_directorio_metrica unique index codigo",
        "CREATE UNIQUE INDEX IF NOT EXISTS uq_directorio_metrica_codigo ON m_directorio_metrica (codigo)")

    # ── medicos: cargo + directorio_metrica_id + FK ───────────────
    run("medicos ADD cargo",
        "ALTER TABLE medicos ADD COLUMN IF NOT EXISTS cargo VARCHAR(150)")
    run("medicos ADD directorio_metrica_id",
        "ALTER TABLE medicos ADD COLUMN IF NOT EXISTS directorio_metrica_id INTEGER")
    run("medicos FK directorio_metrica",
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name='fk_medicos_directorio_metrica' AND table_name='medicos'
            ) THEN
                ALTER TABLE medicos
                ADD CONSTRAINT fk_medicos_directorio_metrica
                FOREIGN KEY (directorio_metrica_id) REFERENCES m_directorio_metrica(id);
            END IF;
        END$$
        """)

    # ── medicos_contacto: correo_corporativo + otro_idioma ────────
    run("contacto ADD correo_corporativo",
        "ALTER TABLE medicos_contacto ADD COLUMN IF NOT EXISTS correo_corporativo VARCHAR(200)")
    run("contacto ADD otro_idioma",
        "ALTER TABLE medicos_contacto ADD COLUMN IF NOT EXISTS otro_idioma VARCHAR(100)")

    print("=== alter_tables END ===")

if __name__ == "__main__":
    apply_alters()
