from database import SessionLocal, engine, Base
from model import Categoria, Departamento, Seccion, EspecialidadMetrica, Ciudad, CondicionLaboral
Base.metadata.create_all(bind=engine)


def upsert(db, model_class, pk_field, pk_value, **kwargs):
    obj = db.query(model_class).filter(getattr(model_class, pk_field) == pk_value).first()
    if obj:
        for k, v in kwargs.items():
            setattr(obj, k, v)
    else:
        db.add(model_class(**{pk_field: pk_value}, **kwargs))


def seed():
    db = SessionLocal()
    try:

        # ── CATEGORIAS ──────────────────────────────────────────────────────────
        for code, nombre in [
            ("A",   "Adscritos"),
            ("AE",  "Adscritos con prerrogativas especiales y/o institucionales"),
            ("AP",  "Adscritos con prerrogativas temporales"),
            ("C",   "Consultores"),
            ("E",   "Eméritos"),
            ("H",   "Hospitalarios"),
            ("I",   "Institucionales"),
            ("N/D", "NO DEFINIDOS"),
            ("O",   "Otros"),
            ("PE",  "Prerrogativas extraordinarias"),
            ("PSI", "Psicólogos Clínicos"),
        ]:
            upsert(db, Categoria, "code", code, nombre=nombre)

        # ── CONDICIONES LABORALES ────────────────────────────────────────────────
        # Eliminar placeholder antiguo si existe
        old = db.query(CondicionLaboral).filter_by(condicion="Seleccionar condicion...").first()
        if old:
            db.delete(old)

        for condicion in [
            "Salario Base",
            "Salario Base + Jornadas Adicionales",
            "Salario Base + Jornadas Adicionales + Productividad",
            "Salario Base + Productividad",
            "Salario Base + Disponibilidad",
            "Salario Base + Disponibilidad + Productividad",
            "Salario Base + Bonificación",
            "N.A.",
        ]:
            if not db.query(CondicionLaboral).filter_by(condicion=condicion).first():
                db.add(CondicionLaboral(condicion=condicion))

        # ── DEPARTAMENTOS — Coordinación (tipo='coordinacion') ───────────────────
        for id_, nombre in [
            ("D0000", "Departamento sin especificar"),
            ("D0001", "Departamento de Anestesia"),
            ("D0002", "Departamento de Cirugía"),
            ("D0003", "Departamento de Ginecología, Obstetricia y Reproducción Humana"),
            ("D0004", "Departamento de Imágenes Diagnósticas"),
            ("D0005", "Departamento de Medicina Crítica y Cuidado Intensivo"),
            ("D0006", "Departamento de Medicina Física y Rehabilitación"),
            ("D0007", "Departamento de Medicina Interna"),
            ("D0008", "Departamento de Neurología"),
            ("D0009", "Departamento de Ortopedia y Traumatología"),
            ("D0010", "Departamento de Patología y Laboratorios"),
            ("D0011", "Departamento de Pediatría"),
            ("D0012", "Departamento de Salud Mental"),
            ("D0013", "Departamento de Salud Oral"),
            ("D0014", "Departamento de Urología"),
            ("D0015", "Instituto de Cáncer"),
            ("D0016", "Departamento de Servicios Médicos de Emergencia y Trauma"),
            ("D0017", "Medicina del Ejercicio y Terapias Complementarias"),
            ("D0018", "Servicio de Genética Clínica"),
            ("D0019", "Servicio de Trasplantes y Cirugía Hepatobiliar"),
            ("D0020", "Departamento de Neurocirugía"),
            ("D0021", "Departamento de Otorrinolaringología"),
        ]:
            upsert(db, Departamento, "id", id_, nombre=nombre, tipo="coordinacion")

        # ── DEPARTAMENTOS — Dirección Médica (tipo='dm') ─────────────────────────
        for id_, nombre in [
            ("DM01", "Departamento de Anestesiología"),
            ("DM02", "Departamento de Anestesiología - Instituto de Cáncer"),
            ("DM03", "Departamento de Cirugía"),
            ("DM04", "Departamento de Medicina Interna"),
            ("DM05", "Departamento de Medicina Interna - Instituto de Cáncer"),
            ("DM06", "Departamento de Pediatría"),
            ("DM07", "Departamento de Pediatría - Instituto de Cáncer"),
            ("DM08", "Departamento de Ortopedia y Traumatología"),
            ("DM09", "Departamento de Ginecología, Obstetricia y Reproducción Humana"),
            ("DM10", "Departamento de Medicina Crítica y Cuidado Intensivo"),
            ("DM11", "Departamento de Medicina Crítica y Cuidado Intensivo - Dpto. de Medicina Interna"),
            ("DM12", "Departamento de Medicina Crítica y Cuidado Intensivo - Dpto. de Anestesiología"),
            ("DM13", "Departamento de Imágenes Diagnósticas"),
            ("DM14", "Departamento de Patología y Laboratorios Clínicos"),
            ("DM15", "Instituto de Cáncer"),
            ("DM16", "Instituto de Servicios Médicos de Emergencia y Trauma"),
            ("DM17", "Instituto de Servicios Médicos de Emergencia y Trauma - Dpto. de Medicina Interna"),
            ("DM18", "Departamento de Urología"),
            ("DM19", "Departamento de Otorrinolaringología"),
            ("DM20", "Departamento de Neurocirugía"),
            ("DM21", "Departamento de Salud Oral"),
            ("DM22", "Departamento de Salud Mental"),
            ("DM23", "Departamento de Neurología"),
            ("DM24", "Jefatura Gestión Clínica"),
        ]:
            upsert(db, Departamento, "id", id_, nombre=nombre, tipo="dm")

        # ── SECCIONES ────────────────────────────────────────────────────────────
        for id_, nombre in [
            ("S0000", "Sección sin especificar"),
            # Anestesia
            ("S0001", "Anestesia General"),
            ("S0002", "Anestesia Cardiovascular"),
            ("S0003", "Anestesia - Clínica de dolor"),
            ("S0004", "Consulta de Anestesia"),
            ("S0005", "Anestesia - Clínica Obstétrica"),
            ("S0006", "Anestesia - Medicina Crítica"),
            ("S0007", "Neuroanestesia"),
            ("S0008", "Anestesia Pediátrica"),
            ("S0009", "Anestesia Trasplantes"),
            # Cirugía
            ("S0010", "Cirugía Cardiovascular"),
            ("S0011", "Cirugía Cabeza y Cuello"),
            ("S0012", "Cirugía de Colon y Recto"),
            ("S0013", "Cirugía de Seno"),
            ("S0014", "Cirugía de Tórax"),
            ("S0015", "Cirugía Endoscópica"),
            ("S0016", "Cirugía General"),
            ("S0018", "Cirugía Pediátrica"),
            ("S0019", "Cirugía Plástica"),
            ("S0020", "Cirugía Vascular"),
            ("S0021", "Endoscopia Digestiva"),
            ("S0022", "Neurocirugía"),
            ("S0023", "Oftalmología"),
            ("S0024", "Otorrinolaringología"),
            ("S0025", "Soporte Metabólico y Nutricional"),
            # Ginecología / Obstetricia
            ("S0026", "Endocrinología e Infertilidad"),
            ("S0028", "Ginecología"),
            ("S0029", "Medicina Materno Fetal"),
            ("S0030", "Obstetricia"),
            ("S0031", "Oncología Ginecológica"),
            ("S0125", "Cirugía Minimamente Invasiva Ginecológica"),
            # Imágenes / Radiología
            ("S0033", "Imágenes Diagnósticas"),
            ("S0035", "Mamografía"),
            ("S0036", "Medicina Nuclear"),
            ("S0037", "Neuroimagen"),
            ("S0038", "Neuroradiología"),
            ("S0040", "Procedimientos e Intervencionismo"),
            ("S0041", "Radiología"),
            ("S0042", "Radiología Convencional"),
            ("S0043", "Radiología de Tórax"),
            ("S0044", "Ultrasonido"),
            ("S0141", "Radiología Intervencionista"),
            # Medicina Interna / Especialidades adultos
            ("S0049", "Alergias"),
            ("S0050", "Cardiología"),
            ("S0051", "Cardiología Electrofisiología"),
            ("S0052", "Cardiología Hemodinámica"),
            ("S0053", "Dermatología"),
            ("S0054", "Endocrinología"),
            ("S0055", "Enfermedades Infecciosas"),
            ("S0056", "Gastroenterología"),
            ("S0057", "Geriatría"),
            ("S0058", "Hematología"),
            ("S0059", "Hepatología"),
            ("S0060", "Hospitalización"),
            ("S0061", "Medicina Familiar"),
            ("S0062", "Medicina Interna General"),
            ("S0063", "Medicina Interna General Ambulatoria"),
            ("S0064", "Nefrología"),
            ("S0065", "Neumología"),
            ("S0066", "Reumatología"),
            ("S0067", "Servicio de Salud Ejecutiva"),
            ("S0068", "Toxicología"),
            ("S0069", "Urgencias"),
            # Neurología
            ("S0070", "Clínica de Sueño"),
            ("S0071", "Electroencefalografía"),
            ("S0072", "Electromiografía"),
            ("S0073", "Neurología Clínica"),
            ("S0074", "Vascular"),
            # Ortopedia
            ("S0075", "Cirugía de Columna"),
            ("S0076", "Cirugía de Hombro y Codo"),
            ("S0077", "Cirugía de Mano y Microcirugía"),
            ("S0078", "Cirugía de Ortopedia Infantil"),
            ("S0079", "Cirugía de Pie y Tobillo"),
            ("S0080", "Ortopedia, Enfermedades Metabólicas y Hereditarias"),
            ("S0082", "Medicina Deportiva Artroscópica"),
            ("S0083", "Ortopedia y Traumatología"),
            ("S0084", "Trauma y Cirugía de Pelvis"),
            ("S0085", "Urgencias Ortopédicas"),
            # Pediatría
            ("S0086", "Alergología e Inmunología"),
            ("S0087", "Área de Cuidado Crítico"),
            ("S0088", "Área de Cuidado Crítico Pediátrico"),
            ("S0089", "Cardiología Pediátrica"),
            ("S0090", "Consulta Externa Pediátrica"),
            ("S0091", "Dermatología Pediátrica"),
            ("S0093", "Endocrinología Pediátrica"),
            ("S0094", "Gastroenterología Pediátrica"),
            ("S0095", "Infectología Pediátrica"),
            ("S0096", "Investigación"),
            ("S0098", "Medicina de Adolescentes"),
            ("S0099", "Nefrología Pediátrica"),
            ("S0100", "Neumología Pediátrica"),
            ("S0101", "Neurología Pediátrica"),
            ("S0102", "Oncología Pediátrica"),
            ("S0103", "Pediatría General"),
            ("S0104", "Psiquiatría Pediátrica"),
            ("S0105", "Reumatología Infantil"),
            ("S0107", "Urgencias Pediátricas"),
            ("S0126", "Área de Cuidado Crítico Neonatal"),
            # Psiquiatría / Psicología
            ("S0108", "Psicología"),
            ("S0109", "Psiquiatría de Adultos"),
            ("S0111", "Psiquiatría Infantil y de Adolescentes"),
            # Salud Oral
            ("S0113", "Cirugía Oral y Maxilofacial"),
            ("S0114", "Crecimiento y Desarrollo"),
            ("S0115", "Medicina Oral"),
            # Urología
            ("S0116", "Clínica de Próstata"),
            ("S0117", "Endo-urología y Litiasis"),
            ("S0118", "Piso pélvico e Incontinencia urinaria"),
            ("S0119", "Urología"),
            ("S0120", "Urología Oncológica"),
            ("S0121", "Urología Pediátrica"),
            # Oncología / Otros
            ("S0112", "Centro Ambulatorio Oncológico Gustavo Cayedo"),
            ("S0122", "Cuidado Paliativo"),
            ("S0123", "Física Médica"),
            ("S0127", "Anatomía Patológica"),
            ("S0128", "Instituto de Servicios Médicos de Emergencia y Trauma"),
            ("S0129", "Medicina del Ejercicio y Terapias Complementarias"),
            ("S0130", "Servicio de Genética Clínica"),
            ("S0137", "Medicina Física y Rehabilitación"),
            ("S0138", "Medicina General Hospitalaria"),
            ("S0140", "Medicina General Urgencias"),
        ]:
            upsert(db, Seccion, "id", id_, nombre=nombre)

        # ── ESPECIALIDADES MÉTRICAS ──────────────────────────────────────────────
        for nombre in [
            "Especialista en Alergología",
            "Especialista en Alergología Pediátrica",
            "Especialista en Anestesiología",
            "Especialista en Cadera y Rodilla",
            "Especialista en Cardiología",
            "Especialista en Cardiología Pediátrica",
            "Especialista en Cirugía Bariátrica y Laparoscópica",
            "Especialista en Cirugía Cardiovascular",
            "Especialista en Cirugía de Cabeza y Cuello",
            "Especialista en Cirugía de Colon y Recto",
            "Especialista en Cirugía de Hombro y Codo",
            "Especialista en Cirugía de Mano",
            "Especialista en Cirugía de Seno",
            "Especialista en Cirugía de Torax",
            "Especialista en Cirugía de Trasplantes",
            "Especialista en Cirugía de Trauma y Pelvis",
            "Especialista en Cirugía Endoscópica Ginecológica",
            "Especialista en Cirugía Gastrointestinal",
            "Especialista en Cirugía General",
            "Especialista en Cirugía Oncológica",
            "Especialista en Cirugía Oral y Maxilofacial",
            "Especialista en Cirugía Pediátrica",
            "Especialista en Cirugía Plástica",
            "Especialista en Cirugía Vascular",
            "Especialista en Columna",
            "Especialista en Cuidado Intensivo",
            "Especialista en Cuidado Intensivo Pediátrico",
            "Especialista en Dermatología",
            "Especialista en Dermatología Pediátrica",
            "Especialista en Endocrinología",
            "Especialista en Endocrinología Pediátrica",
            "Especialista en Endodoncia",
            "Especialista en Fonoaudiología",
            "Especialista en Gastroenterología",
            "Especialista en Gastroenterología Pediátrica",
            "Especialista en Genética",
            "Especialista en Geriatría",
            "Especialista en Ginecología Oncológica",
            "Especialista en Ginecología y Obstetricia",
            "Especialista en Hematología",
            "Especialista en Hematología y Oncología Clínica",
            "Especialista en Hematología y Oncología Pediátrica",
            "Especialista en Hepatología",
            "Especialista en Infectología",
            "Especialista en Infectología Pediátrica",
            "Especialista en Medicina Crítica",
            "Especialista en Medicina de Adolescentes",
            "Especialista en Medicina de Dolor y Cuidado Paliativo",
            "Especialista en Medicina de Emergencias",
            "Especialista en Medicina del Deporte",
            "Especialista en Medicina Familiar",
            "Especialista en Medicina Física y Rehabilitación",
            "Especialista en Medicina Interna",
            "Especialista en Medicina Materno Fetal",
            "Especialista en Medicina Nuclear",
            "Especialista en Microbiología y Parasitología",
            "Especialista en Nefrología",
            "Especialista en Nefrología Pediátrica",
            "Especialista en Neonatología",
            "Especialista en Neumología",
            "Especialista en Neumología Pediátrica",
            "Especialista en NeuroCirugía",
            "Especialista en NeuroCirugía Pediátrica",
            "Especialista en Neurología",
            "Especialista en Neurología Pediátrica",
            "Especialista en Odontología Pediátrica",
            "Especialista en Oftalmología",
            "Especialista en Oftalmología Pediátrica",
            "Especialista en Oncología Clínica",
            "Especialista en Oncología Pediátrica",
            "Especialista en Ortodoncia",
            "Especialista en Ortopedia Pediátrica",
            "Especialista en Ortopedia y Traumatología",
            "Especialista en Otorrinolaringología",
            "Especialista en Patología",
            "Especialista en Patología y Cirugía Bucal",
            "Especialista en Pediatría",
            "Especialista en Periodoncia y Medicina Oral",
            "Especialista en Prostodoncia",
            "Especialista en Psiquiatría",
            "Especialista en Psiquiatría Pediátrica",
            "Especialista en Radiología e Imágenes Diagnósticos",
            "Especialista en Radiología Intervencionista",
            "Especialista en Rehabilitación Oral",
            "Especialista en Reumatología",
            "Especialista en Reumatología Pediátrica",
            "Especialista en Rodilla",
            "Especialista en Salud Ocupacional",
            "Especialista en Soporte Metabólico y Nutricional",
            "Especialista en Urología",
            "Especialista en Urología Oncológica",
            "Especialista en Urología Pediátrica",
            "Físico Médico",
            "Magister en Bioética",
            "Médico General",
            "Psicología",
        ]:
            if not db.query(EspecialidadMetrica).filter_by(nombre=nombre).first():
                db.add(EspecialidadMetrica(nombre=nombre))

        # ── CIUDADES (expedición + nacimiento, combinadas) ───────────────────────
        for ciudad in sorted({
            "Aguachica (Cesar)", "Agustín Codazzi", "Arjona",
            "Armero (Guayabal)(Tolima)", "Barrancabermeja", "Barrancas",
            "Barranquilla", "Bogotá D.C.", "Bucaramanga", "Calamar", "Cali",
            "Carepa (Antioquia)", "Cartagena", "Cartago", "Cerete (Córdoba)",
            "Charala (Santander)", "Chia", "Chima", "Chiquinquirá", "Chiriguaná",
            "Colombia", "Con Toronto Can", "Córdoba", "Corozal (Sucre)", "Cuba",
            "Cúcuta", "Duitama", "El Banco (Magdalena)", "Espinal", "Galeras",
            "Girardot Cundinamarca", "Guadalupe", "Guatemala", "Ibagué",
            "La Plata (Huila)", "La Unión", "Magangué", "Malambo", "Manizales",
            "Medellín", "Mompox", "Montelíbano", "Montería", "Morales",
            "Natagaima", "Neiva", "Ocaña (Norte de Santander)", "Paipa (Boyacá)",
            "Pasto", "Pitalito", "Planeta Rica Córdoba", "Puerto Colombia",
            "Puerto Wilches", "Quibdo (Choco)", "Riohacha", "Sahagun",
            "San Andres", "San Jacinto (Bolívar)", "San Juan del Cesar",
            "San Marco (Sucre)", "San Onofre", "Santa Lucía (Atlántico)",
            "Santa Marta", "Sardinata (Norte de Santander)", "Sincelejo",
            "Sogamoso", "Soledad", "Sucre", "Sutatenza", "Talaigua Nuevo",
            "Tocaima", "Tolú", "Tolú Viejo (Sucre)", "Tubara", "Tunja",
            "Turbaco", "Turbana", "Usaquén", "Valledupar", "Villanueva",
            "Villavicencio", "Yopal",
        }):
            if not db.query(Ciudad).filter_by(nombre=ciudad).first():
                db.add(Ciudad(nombre=ciudad))

        db.commit()
        print("OK - Todas las tablas maestras sembradas exitosamente")
        print("  - Categorias:            11 registros")
        print("  - Condiciones laborales:  8 registros")
        print("  - Departamentos coord.:  22 registros (D0000-D0021)")
        print("  - Departamentos DM:      24 registros (DM01-DM24)")
        print("  - Secciones:           ~120 registros (S0000-S0141)")
        print("  - Especialidades:        94 registros")
        print("  - Ciudades:              83 registros")

    except Exception as e:
        print("Error:", e)
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
