from database import engine
from sqlalchemy import text

def apply_alters():
    with engine.connect() as conn:
        try:
            # Medicos_datos_hv
            conn.execute(text("ALTER TABLE medicos_datos_hv ADD COLUMN antecedentes_disciplinarios VARCHAR(20);"))
            conn.execute(text("ALTER TABLE medicos_datos_hv ADD COLUMN antecedentes_judiciales VARCHAR(20);"))
        except Exception as e:
            print("datos_hv error:", e)
            
        try:
            # Medicos_normativos
            conn.execute(text("ALTER TABLE medicos_normativos ADD COLUMN tarjeta_profesional VARCHAR(20);"))
            conn.execute(text("ALTER TABLE medicos_normativos ADD COLUMN examen_medico VARCHAR(20);"))
        except Exception as e:
            print("normativos error:", e)
            
        try:
            # Medicos_contratacion
            conn.execute(text("ALTER TABLE medicos_contratacion ADD COLUMN contrato_prestacion VARCHAR(20);"))
        except Exception as e:
            print("contratacion error:", e)
        try:
            conn.execute(text("ALTER TABLE medicos_normativos ADD COLUMN aiepi_fecha DATE;"))
            conn.execute(text("ALTER TABLE medicos_normativos ADD COLUMN aiepi_estado VARCHAR(20);"))
            conn.execute(text("ALTER TABLE medicos_normativos ADD COLUMN gestion_donante_fecha DATE;"))
            conn.execute(text("ALTER TABLE medicos_normativos ADD COLUMN gestion_donante_estado VARCHAR(20);"))
            conn.execute(text("ALTER TABLE medicos_normativos ADD COLUMN telemedicina_fecha DATE;"))
            conn.execute(text("ALTER TABLE medicos_normativos ADD COLUMN telemedicina_estado VARCHAR(20);"))
        except Exception as e:
            print("normativos fsfb cols error:", e)

        conn.commit()
    print("Alter tables completed")

if __name__ == "__main__":
    apply_alters()
