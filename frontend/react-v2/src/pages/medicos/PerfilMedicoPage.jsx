import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PerfilMedicoPage.css";

// ─── TABLAS MAESTRAS ──────────────────────────────────────────────────────────
const CATEGORIAS = [
  { code: "H", label: "Hospitalarios" },
  { code: "I", label: "Institucionales" },
  { code: "AE", label: "Adscritos c/ prerrogativas especiales" },
  { code: "AP", label: "Adscritos c/ prerrogativas temporales" },
  { code: "A", label: "Adscritos" },
  { code: "C", label: "Consultores" },
  { code: "E", label: "Eméritos" },
  { code: "PE", label: "Prerrogativas extraordinarias" },
  { code: "PSI", label: "Psicólogos Clínicos" },
  { code: "N/D", label: "No Definidos" },
  { code: "O", label: "Otros" },
];

const DEPARTAMENTOS = [
  "Departamento de Anestesiología",
  "Departamento de Anestesiología - Instituto de Cáncer",
  "Departamento de Cirugía",
  "Departamento de Medicina Interna",
  "Departamento de Medicina Interna - Instituto de Cáncer",
  "Departamento de Pediatría",
  "Departamento de Pediatría - Instituto de Cáncer",
  "Departamento de Ortopedia y Traumatología",
  "Departamento de Ginecología, Obstetricia y Reproducción Humana",
  "Departamento de Medicina Crítica y Cuidado Intensivo",
  "Departamento de Imágenes Diagnósticas",
  "Departamento de Patología y Laboratorios Clínicos",
  "Instituto de Cáncer",
  "Instituto de Servicios Médicos de Emergencia y Trauma",
  "Departamento de Urología",
  "Departamento de Otorrinolaringología",
  "Jefatura Gestión Clínica",
];

const SECCIONES = [
  "Alergología", "Anatomía Patológica", "Anestesia Cardiovascular",
  "Anestesia General", "Cardiología", "Cardiología Pediátrica",
  "Cirugía Cardiovascular", "Cirugía de Cabeza y Cuello", "Cirugía de Cadera",
  "Cirugía de Colon y Recto", "Cirugía de Columna", "Cirugía Endoscópica",
  "Cirugía General", "Cirugía Pediátrica", "Enfermedades Infecciosas",
  "Gastroenterología", "Ginecología", "Hematología", "Infectología",
  "Medicina Interna General", "Neonatología", "Neuroanestesia",
  "Neurocirugia", "Neurología", "Obstetricia", "Oncología", "Ortopedia",
  "Otorrinolaringología", "Pediatría General", "Urgencias Pediátricas",
];

const TIPO_VINCULACION = [
  "Laboral", "Oferta Mercantil", "Laboral + Oferta Mercantil",
  "N.A. - Emérito", "Consultor",
];

const ESTADO_DOC_OPTS = ["OK", "PENDIENTE", "N.A."];

const NORMATIVOS_ITEMS = [
  { key: "bls", label: "BLS", conFecha: true },
  { key: "acls", label: "ACLS", conFecha: true },
  { key: "pals", label: "PALS", conFecha: true },
  { key: "nals", label: "NALS", conFecha: true },
  { key: "violencia_sexual", label: "Violencia Sexual", conFecha: true },
  { key: "ataques_quimicos", label: "Ataques Agentes Químicos", conFecha: true },
  { key: "dengue", label: "Dengue", conFecha: true },
  { key: "sedacion", label: "Sedación", conFecha: true },
  { key: "radioproteccion", label: "Radioprotección", conFecha: true },
  { key: "manejo_dolor", label: "Manejo del Dolor", conFecha: true },
  { key: "iamii", label: "IAMII", conFecha: true },
  { key: "gestion_duelo", label: "Gestión del Duelo", conFecha: true },
  { key: "res_ejercicio", label: "Res. Aut. Ejercicio/Plaza Rural", conFecha: false },
  { key: "res_anestesiologo", label: "Resolución Anestesiólogo", conFecha: false },
  { key: "tarjeta_rethus", label: "Tarjeta RETHUS", conFecha: false },
  { key: "consulta_rethus", label: "Consulta RETHUS", conFecha: false },
];

const SECTIONS_CONFIG = [
  { key: "datosGenerales", label: "Datos Generales", icon: "local_hospital" },
  { key: "datosPersonales", label: "Datos Personales", icon: "lock" },
  { key: "contacto", label: "Contacto", icon: "contact_phone" },
  { key: "documentosHV", label: "Carpeta 1 · HV", icon: "folder" },
  { key: "prerrogativas", label: "Carpeta 2-3 · Prerrog.", icon: "account_balance" },
  { key: "diplomas", label: "Carpeta 4 · Diplomas", icon: "school" },
  { key: "normativos", label: "Carpeta 5 · Normativos", icon: "verified" },
  { key: "contratacion", label: "Contratación", icon: "description" },
  { key: "inducciones", label: "Accesos y Pólizas", icon: "badge" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function calcularEstadoNormativo(fechaStr) {
  if (!fechaStr) return null;
  const diff = (new Date(fechaStr) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff > 30) return "vigente";
  if (diff >= 0) return "por_vencer";
  return "vencido";
}

function pctColor(pct) {
  if (pct >= 80) return "#0A7E6E";
  if (pct >= 40) return "#1a4ed7";
  return "#94a3b8";
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function BadgeEstado({ estado }) {
  const cfg = {
    vigente: { bg: "rgba(10,126,110,0.08)", color: "#065f46", border: "rgba(10,126,110,0.22)", dot: "#0A7E6E", label: "Vigente" },
    por_vencer: { bg: "rgba(180,120,0,0.08)", color: "#92600a", border: "rgba(180,120,0,0.22)", dot: "#d97706", label: "Por Vencer" },
    vencido: { bg: "rgba(186,26,26,0.08)", color: "#ba1a1a", border: "rgba(186,26,26,0.22)", dot: "#ba1a1a", label: "Vencido" },
  };
  if (!estado || !cfg[estado]) return null;
  const c = cfg[estado];
  return (
    <span className="pmp-badge-estado" style={{ background: c.bg, color: c.color, borderColor: c.border }}>
      <span className="pmp-badge-dot" style={{ background: c.dot }} />
      {c.label}
    </span>
  );
}

function FormField({ label, required, hint, children }) {
  return (
    <div className="pmp-field">
      <label className="pmp-label">
        {label}
        {required && <span className="pmp-required">*</span>}
      </label>
      {children}
      {hint && <p className="pmp-hint">{hint}</p>}
    </div>
  );
}

function InputField({ value, onChange, placeholder, type = "text", disabled, maxLength }) {
  return (
    <input
      type={type}
      className="pmp-input"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
    />
  );
}

function SelectField({ options, value, onChange, placeholder = "Seleccionar..." }) {
  return (
    <div className="pmp-select-wrap">
      <select className="pmp-input pmp-select" value={value || ""} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={typeof o === "string" ? o : o.code} value={typeof o === "string" ? o : o.code}>
            {typeof o === "string" ? o : `${o.code} — ${o.label}`}
          </option>
        ))}
      </select>
      <span className="material-symbols-outlined pmp-select-icon">expand_more</span>
    </div>
  );
}

const DOC_STATUS_STYLES = {
  "OK": { color: "#065f46", bg: "rgba(10,126,110,0.07)", border: "rgba(10,126,110,0.28)" },
  "PENDIENTE": { color: "#92600a", bg: "rgba(180,120,0,0.07)", border: "rgba(180,120,0,0.28)" },
  "N.A.": { color: "#444650", bg: "rgba(100,103,115,0.06)", border: "rgba(197,198,210,0.5)" },
};

function DocStatusSelect({ value, onChange }) {
  const s = DOC_STATUS_STYLES[value] || {};
  return (
    <div className="pmp-select-wrap">
      <select
        className="pmp-input pmp-select"
        style={value ? { color: s.color, background: s.bg, borderColor: s.border, fontWeight: 500 } : {}}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
      >
        <option value="">— Estado —</option>
        {ESTADO_DOC_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span className="material-symbols-outlined pmp-select-icon">expand_more</span>
    </div>
  );
}

function SubTitle({ children }) {
  return <p className="pmp-subtitle">{children}</p>;
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ id, title, subtitle, icon, children, completitud }) {
  const pct = Math.round(completitud ?? 0);
  const fill = pctColor(pct);
  return (
    <div id={id} className="pmp-section-card">
      <div className="pmp-section-header">
        <div className="pmp-section-header-left">
          <div className="pmp-section-icon">
            <span className="material-symbols-outlined pmp-icon-filled">{icon}</span>
          </div>
          <div>
            <span className="pmp-section-title">{title}</span>
            {subtitle && <span className="pmp-section-subtitle">{subtitle}</span>}
          </div>
        </div>
        <div className="pmp-section-progress">
          <div className="pmp-mini-bar">
            <div className="pmp-mini-bar-fill" style={{ width: `${pct}%`, background: fill }} />
          </div>
          <span className="pmp-section-pct" style={{ color: fill }}>{pct}%</span>
        </div>
      </div>
      <div className="pmp-section-body">{children}</div>
    </div>
  );
}

// ─── SECCIÓN: DATOS GENERALES ─────────────────────────────────────────────────
function SeccionDatosGenerales({ data, onChange, completitud }) {
  return (
    <SectionCard id="sec-datosGenerales" title="Datos Generales" subtitle="Carpeta principal del Cuerpo Médico" icon="local_hospital" completitud={completitud}>
      <div className="pmp-grid-3">
        <FormField label="Categoría" required>
          <SelectField options={CATEGORIAS} value={data.categoria} onChange={v => onChange("categoria", v)} />
        </FormField>
        <FormField label="Nombre completo" required>
          <InputField value={data.nombre} onChange={v => onChange("nombre", v)} placeholder="Apellidos y nombres" />
        </FormField>
        <FormField label="Especialidad (certificada en diplomas)" required>
          <InputField value={data.especialidad} onChange={v => onChange("especialidad", v)} placeholder="Ej: Especialista en Medicina Interna" />
        </FormField>
        <FormField label="Departamento Coordinación" required>
          <SelectField options={DEPARTAMENTOS} value={data.deptCoord} onChange={v => onChange("deptCoord", v)} />
        </FormField>
        <FormField label="Departamento Dirección Médica" required>
          <SelectField options={DEPARTAMENTOS} value={data.deptDM} onChange={v => onChange("deptDM", v)} />
        </FormField>
        <FormField label="Sección">
          <SelectField options={SECCIONES} value={data.seccion} onChange={v => onChange("seccion", v)} />
        </FormField>
      </div>
      <div className="pmp-divider">
        <SubTitle>Métricas DRG</SubTitle>
        <div className="pmp-grid-4">
          {[
            { key: "metCodigoDept", label: "Código Depto." },
            { key: "metDeptDRG", label: "Departamento DRG" },
            { key: "metCodigoSec", label: "Código Sección" },
            { key: "metSeccion", label: "Sección Métrica" },
          ].map(f => (
            <FormField key={f.key} label={f.label}>
              <InputField value={data[f.key]} onChange={v => onChange(f.key, v)} placeholder="—" />
            </FormField>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

// ─── SECCIÓN: DATOS PERSONALES ────────────────────────────────────────────────
function SeccionDatosPersonales({ data, onChange, completitud }) {
  return (
    <SectionCard id="sec-datosPersonales" title="Datos Personales" subtitle="Datos sensibles — Ley 1581 de 2012" icon="lock" completitud={completitud}>
      <div className="pmp-banner pmp-banner--warn">
        <span className="material-symbols-outlined">warning</span>
        <p>Datos personales sensibles. Solo usuarios con rol autorizado pueden visualizarlos. Tratamiento conforme a Ley 1581/2012.</p>
      </div>
      <div className="pmp-grid-3">
        <FormField label="Form. Autorización Datos" required hint="Firmado por el titular">
          <DocStatusSelect value={data.autDatos} onChange={v => onChange("autDatos", v)} />
        </FormField>
        <FormField label="Tipo de Documento" required>
          <SelectField options={["C.C.", "C.E."]} value={data.tipoDoc} onChange={v => onChange("tipoDoc", v)} />
        </FormField>
        <FormField label="Número de Cédula" required>
          <InputField value={data.cedula} onChange={v => onChange("cedula", v.replace(/\D/g, ""))} placeholder="Solo dígitos" maxLength={15} />
        </FormField>
        <FormField label="Lugar de Expedición" required>
          <InputField value={data.lugarExp} onChange={v => onChange("lugarExp", v)} placeholder="Ciudad" />
        </FormField>
        <FormField label="Fecha de Nacimiento" required>
          <InputField type="date" value={data.fechaNac} onChange={v => onChange("fechaNac", v)} />
        </FormField>
        <FormField label="Sexo" required>
          <SelectField options={[{ code: "M", label: "Masculino" }, { code: "F", label: "Femenino" }]} value={data.sexo} onChange={v => onChange("sexo", v)} />
        </FormField>
        <FormField label="Lugar de Nacimiento">
          <InputField value={data.lugarNac} onChange={v => onChange("lugarNac", v)} placeholder="Ciudad / Municipio" />
        </FormField>
        <FormField label="Foto">
          <DocStatusSelect value={data.foto} onChange={v => onChange("foto", v)} />
        </FormField>
        <FormField label="Hoja de Vida">
          <DocStatusSelect value={data.hv} onChange={v => onChange("hv", v)} />
        </FormField>
      </div>
      <div className="pmp-divider">
        <SubTitle>Extranjeros</SubTitle>
        <div className="pmp-grid-3">
          <FormField label="Documento vigente para extranjeros">
            <SelectField options={["N.A.", "OK"]} value={data.docExtranjero} onChange={v => onChange("docExtranjero", v)} />
          </FormField>
          <FormField label="Fecha vencimiento documento">
            <InputField type="date" value={data.fechaVencDoc} onChange={v => onChange("fechaVencDoc", v)} disabled={data.docExtranjero === "N.A."} />
          </FormField>
          <FormField label="Visa vigente">
            <SelectField options={["N.A.", "OK"]} value={data.visa} onChange={v => onChange("visa", v)} />
          </FormField>
          <FormField label="Fecha vencimiento visa">
            <InputField type="date" value={data.fechaVencVisa} onChange={v => onChange("fechaVencVisa", v)} disabled={data.visa === "N.A."} />
          </FormField>
          <FormField label="Certif. Migración Colombia (RUTEC)">
            <SelectField options={["N.A.", "OK"]} value={data.rutec} onChange={v => onChange("rutec", v)} />
          </FormField>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── SECCIÓN: CONTACTO ────────────────────────────────────────────────────────
function SeccionContacto({ data, onChange, completitud }) {
  const idiomasOpts = ["Inglés", "Francés", "Italiano", "Alemán", "Portugués"];
  return (
    <SectionCard id="sec-contacto" title="Contacto y Datos Adicionales" subtitle="Directorio médico" icon="contact_phone" completitud={completitud}>
      <div className="pmp-grid-3">
        <FormField label="Correo electrónico" required>
          <InputField type="email" value={data.correo} onChange={v => onChange("correo", v)} placeholder="correo@institucion.com" />
        </FormField>
        <FormField label="Teléfono" required>
          <InputField value={data.telefono} onChange={v => onChange("telefono", v)} placeholder="+57 300 000 0000" />
        </FormField>
        <FormField label="Dirección Correspondencia">
          <InputField value={data.direccion} onChange={v => onChange("direccion", v)} placeholder="Dirección completa" />
        </FormField>
        <FormField label="Consultorio Particular">
          <SelectField options={["SI", "NO"]} value={data.consultorio} onChange={v => onChange("consultorio", v)} />
        </FormField>
        <FormField label="Dirección Consultorio">
          <InputField value={data.dirConsultorio} onChange={v => onChange("dirConsultorio", v)} placeholder="Solo si aplica" disabled={data.consultorio === "NO"} />
        </FormField>
        <FormField label="Tiene Hijos">
          <SelectField options={["SI", "NO"]} value={data.tieneHijos} onChange={v => onChange("tieneHijos", v)} />
        </FormField>
        <FormField label="Maneja lengua de señas">
          <SelectField options={["SI", "NO"]} value={data.senas} onChange={v => onChange("senas", v)} />
        </FormField>
      </div>
      <div className="pmp-divider">
        <SubTitle>Dominio de Idiomas</SubTitle>
        <div className="pmp-idiomas-wrap">
          {idiomasOpts.map(idioma => (
            <label key={idioma} className={`pmp-idioma-chip${data[`idioma_${idioma}`] === "SI" ? " active" : ""}`}>
              <input type="checkbox" className="pmp-sr-only" checked={data[`idioma_${idioma}`] === "SI"} onChange={e => onChange(`idioma_${idioma}`, e.target.checked ? "SI" : "NO")} />
              {idioma}
            </label>
          ))}
          <InputField value={data.otroIdioma} onChange={v => onChange("otroIdioma", v)} placeholder="Otro idioma…" />
        </div>
      </div>
    </SectionCard>
  );
}

// ─── SECCIÓN: DOCUMENTOS HV ───────────────────────────────────────────────────
function SeccionDocumentosHV({ data, onChange, completitud }) {
  const docs = [
    { key: "formSolIngreso", label: "Form. Solicitud Ingreso", fechaKey: "fechaFormSol" },
    { key: "formCapEdu", label: "Form. Cap. y Educación", fechaKey: "fechaFormCap" },
    { key: "cartaPresCoordDpto", label: "Carta Pres. Coord. Depto.", fechaKey: "fechaCartaCoord" },
    { key: "cartaPresCoordSec", label: "Carta Pres. Coord. Sección", fechaKey: "fechaCartaCoordSec" },
    { key: "cartaAspirante", label: "Carta Aspirante", fechaKey: "fechaCartaAsp" },
    { key: "cartaRecom1", label: "Carta Recomendación 1", fechaKey: "fechaRecom1" },
    { key: "cartaRecom2", label: "Carta Recomendación 2", fechaKey: "fechaRecom2" },
    { key: "cartaInstitucionalidad", label: "Carta Institucionalidad", fechaKey: null },
    { key: "cartaCodConducta", label: "Carta Cód. Conducta (inicial)", fechaKey: null },
    { key: "cartaPresEntDM", label: "Carta Presentación DM", fechaKey: "fechaPresEntDM" },
  ];
  return (
    <SectionCard id="sec-documentosHV" title="Carpeta 1: Documentos Hoja de Vida" subtitle="Documentos de ingreso y presentación" icon="folder" completitud={completitud}>
      <div className="pmp-doc-table">
        <div className="pmp-doc-table-header">
          <span>Documento</span><span>Estado</span><span>Fecha</span>
        </div>
        {docs.map(doc => (
          <div key={doc.key} className="pmp-doc-row">
            <span className="pmp-doc-label">{doc.label}</span>
            <DocStatusSelect value={data[doc.key]} onChange={v => onChange(doc.key, v)} />
            {doc.fechaKey
              ? <InputField type="date" value={data[doc.fechaKey]} onChange={v => onChange(doc.fechaKey, v)} disabled={data[doc.key] !== "OK"} />
              : <div />
            }
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── SECCIÓN: PRERROGATIVAS ───────────────────────────────────────────────────
function SeccionPrerrogativas({ data, onChange, completitud }) {
  return (
    <SectionCard id="sec-prerrogativas" title="Carpeta 2 & 3: Ingreso y Prerrogativas" subtitle="Proceso de vinculación al cuerpo médico" icon="account_balance" completitud={completitud}>
      <div className="pmp-grid-2">
        <FormField label="Estado Prerrogativas">
          <SelectField
            options={["Prerrogativas Definitivas CME", "Prerrogativas Definitivas CME - Extensión HUFSFB", "Prerrogativas Definitivas CME - Caso Extraordinario", "Prerrogativas Temporales", "PENDIENTE"]}
            value={data.estadoPrerrogativas}
            onChange={v => onChange("estadoPrerrogativas", v)}
          />
        </FormField>
        <FormField label="Fecha Aprobación Definitivas">
          <InputField type="date" value={data.fechaAprobDef} onChange={v => onChange("fechaAprobDef", v)} />
        </FormField>
      </div>
      <div className="pmp-divider">
        <SubTitle>Prerrogativas Temporales</SubTitle>
        <div className="pmp-grid-4">
          {[
            { key: "ptSolicitud", label: "Solicitud", isDate: false },
            { key: "ptFechaSolicitud", label: "Fecha Solicitud", isDate: true },
            { key: "ptRespuesta", label: "Respuesta", isDate: false },
            { key: "ptFechaRespuesta", label: "Fecha Respuesta", isDate: true },
            { key: "ptFechaInicio", label: "Fecha Inicio", isDate: true },
            { key: "ptFechaFin", label: "Fecha Fin", isDate: true },
            { key: "ptNotifCoord", label: "Notif. Coord.", isDate: false },
          ].map(f => (
            <FormField key={f.key} label={f.label}>
              {f.isDate
                ? <InputField type="date" value={data[f.key]} onChange={v => onChange(f.key, v)} />
                : <SelectField options={["SI", "PENDIENTE", "N.A."]} value={data[f.key]} onChange={v => onChange(f.key, v)} />
              }
            </FormField>
          ))}
        </div>
      </div>
      <div className="pmp-divider">
        <SubTitle>Documentos Finales</SubTitle>
        <div className="pmp-grid-3">
          {[
            { key: "cartaAutCred", label: "Carta Autorización Credenciales" },
            { key: "cartaAutIngresoCME", label: "Carta Autorización Ingreso CME" },
            { key: "notifIngresoProfesional", label: "Notif. Ingreso a Profesional" },
            { key: "certEntregaModeloMedico", label: "Certif. Entrega Modelo Médico" },
            { key: "cartaRecepDocsMM", label: "Carta Recepción Docs. Modelo Médico" },
            { key: "declarConflictoInteres", label: "Declaración Conflicto de Interés" },
          ].map(f => (
            <FormField key={f.key} label={f.label}>
              <DocStatusSelect value={data[f.key]} onChange={v => onChange(f.key, v)} />
            </FormField>
          ))}
        </div>
        <div className="pmp-mt">
          <FormField label="Otros documentos relacionados">
            <textarea className="pmp-input pmp-textarea" rows={2} value={data.otrosDocIngreso || ""} onChange={e => onChange("otrosDocIngreso", e.target.value)} placeholder="Describa documentos adicionales…" />
          </FormField>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── SECCIÓN: DIPLOMAS ────────────────────────────────────────────────────────
function TituloForm({ data, prefix, onChange }) {
  return (
    <div className="pmp-titulo-form">
      <div className="pmp-grid-2">
        <FormField label="Diploma (URL S3)" hint="Solo HTTPS">
          <InputField value={data[`${prefix}_diploma`]} onChange={v => onChange(`${prefix}_diploma`, v)} placeholder="https://..." />
        </FormField>
        <FormField label="Acta (URL S3)" hint="Solo HTTPS">
          <InputField value={data[`${prefix}_acta`]} onChange={v => onChange(`${prefix}_acta`, v)} placeholder="https://..." />
        </FormField>
        <FormField label="Nombre del Título">
          <InputField value={data[`${prefix}_nombre`]} onChange={v => onChange(`${prefix}_nombre`, v)} placeholder="Ej: Médico Cirujano" />
        </FormField>
        <FormField label="Universidad">
          <InputField value={data[`${prefix}_universidad`]} onChange={v => onChange(`${prefix}_universidad`, v)} placeholder="Nombre de la institución" />
        </FormField>
        <FormField label="País Universidad">
          <InputField value={data[`${prefix}_pais`]} onChange={v => onChange(`${prefix}_pais`, v)} placeholder="Colombia" />
        </FormField>
        <FormField label="Verificación por Credenciales">
          <DocStatusSelect value={data[`${prefix}_verificacion`]} onChange={v => onChange(`${prefix}_verificacion`, v)} />
        </FormField>
      </div>
    </div>
  );
}

function SeccionDiplomas({ data, onChange, completitud }) {
  const titulos = [
    { key: "pregrado", label: "Diploma Médico General / Odontólogo" },
    { key: "esp1", label: "Especialidad 1" },
    { key: "subesp2", label: "SubEspecialidad 2" },
    { key: "subesp3", label: "SubEspecialidad 3" },
    { key: "otros", label: "Otras Especialidades y Estudios Formales" },
  ];
  return (
    <SectionCard id="sec-diplomas" title="Carpeta 4: Diplomas y Verificaciones" subtitle="Documentos académicos con soporte en S3" icon="school" completitud={completitud}>
      <div className="pmp-grid-3 pmp-mb">
        <FormField label="Cartas Solicitud Verificación">
          <DocStatusSelect value={data.cartasVerif} onChange={v => onChange("cartasVerif", v)} />
        </FormField>
        <FormField label="Soporte Verificación Títulos">
          <DocStatusSelect value={data.soporteVerif} onChange={v => onChange("soporteVerif", v)} />
        </FormField>
        <FormField label="Fecha Verificación Títulos">
          <InputField type="date" value={data.fechaVerif} onChange={v => onChange("fechaVerif", v)} />
        </FormField>
      </div>
      <div className="pmp-titulos-list">
        {titulos.map(t => (
          <div key={t.key} className="pmp-titulo-item">
            <div className="pmp-titulo-label">
              <span className="material-symbols-outlined">arrow_right</span>
              {t.label}
            </div>
            <TituloForm data={data} prefix={t.key} onChange={onChange} />
          </div>
        ))}
      </div>
      <div className="pmp-divider">
        <FormField label="Certificaciones de Entrenamientos Avanzados">
          <textarea className="pmp-input pmp-textarea" rows={2} value={data.certEntrenamientos || ""} onChange={e => onChange("certEntrenamientos", e.target.value)} placeholder="Detallar certificaciones adicionales…" />
        </FormField>
      </div>
    </SectionCard>
  );
}

// ─── SECCIÓN: NORMATIVOS ──────────────────────────────────────────────────────
function SeccionNormativos({ data, onChange, completitud }) {
  return (
    <SectionCard id="sec-normativos" title="Carpeta 5: Normativos" subtitle="La fecha determina el estado automáticamente" icon="verified" completitud={completitud}>
      <div className="pmp-normativos-grid">
        {NORMATIVOS_ITEMS.map(item => {
          const estadoAuto = item.conFecha ? calcularEstadoNormativo(data[`${item.key}_fecha`]) : null;
          return (
            <div key={item.key} className="pmp-normativo-card">
              <p className="pmp-normativo-title">{item.label}</p>
              {item.conFecha ? (
                <>
                  <InputField type="date" value={data[`${item.key}_fecha`]} onChange={v => onChange(`${item.key}_fecha`, v)} />
                  <div className="pmp-normativo-status">
                    {estadoAuto
                      ? <BadgeEstado estado={estadoAuto} />
                      : <span className="pmp-no-fecha">Sin fecha</span>
                    }
                  </div>
                </>
              ) : (
                <DocStatusSelect value={data[`${item.key}_estado`]} onChange={v => onChange(`${item.key}_estado`, v)} />
              )}
            </div>
          );
        })}
      </div>
      <div className="pmp-divider pmp-grid-2">
        <FormField label="Títulos Consulta RETHUS" hint="Texto descriptivo">
          <textarea className="pmp-input pmp-textarea" rows={3} value={data.titulosRethus || ""} onChange={e => onChange("titulosRethus", e.target.value)} placeholder={"MEDICINA\nMEDICINA INTERNA…"} />
        </FormField>
        <FormField label="Cursos últimos 3 años">
          <DocStatusSelect value={data.cursos3anos} onChange={v => onChange("cursos3anos", v)} />
        </FormField>
      </div>
    </SectionCard>
  );
}

// ─── SECCIÓN: CONTRATACIÓN ────────────────────────────────────────────────────
function SeccionContratacion({ data, onChange, completitud }) {
  const esLaboral = data.tipoVinculacion === "Laboral" || data.tipoVinculacion === "Laboral + Oferta Mercantil";
  const esMercantil = data.tipoVinculacion === "Oferta Mercantil" || data.tipoVinculacion === "Laboral + Oferta Mercantil";
  return (
    <SectionCard id="sec-contratacion" title="Contratación" subtitle="Contrato Laboral y Oferta Mercantil" icon="description" completitud={completitud}>
      <div className="pmp-grid-2 pmp-mb">
        <FormField label="Tipo de Vinculación" required>
          <SelectField options={TIPO_VINCULACION} value={data.tipoVinculacion} onChange={v => onChange("tipoVinculacion", v)} />
        </FormField>
        <FormField label="Estado Contrato Laboral">
          <SelectField options={["Contratado", "N.A."]} value={data.estadoContrato} onChange={v => onChange("estadoContrato", v)} />
        </FormField>
      </div>
      {esLaboral && (
        <div className="pmp-sub-block">
          <SubTitle>Contrato Laboral</SubTitle>
          <div className="pmp-grid-3">
            <FormField label="Jornada">
              <SelectField options={["0.25", "0.5", "0.75", "1", "1.25", "N.A."]} value={data.jornada} onChange={v => onChange("jornada", v)} />
            </FormField>
            <FormField label="Tipo">
              <SelectField options={["Término Fijo", "Término Indefinido", "Temporal", "N.A."]} value={data.tipoContrato} onChange={v => onChange("tipoContrato", v)} />
            </FormField>
            <FormField label="Fecha Firma">
              <InputField type="date" value={data.fechaFirmaContrato} onChange={v => onChange("fechaFirmaContrato", v)} />
            </FormField>
            <div className="pmp-col-span-3">
              <FormField label="Condiciones">
                <SelectField
                  options={["Salario Base", "Salario Base + Jornadas Adicionales", "Salario Base + Jornadas Adicionales + Productividad", "Salario Base + Productividad", "Salario Base + Disponibilidad", "Salario Base + Bonificación", "N.A."]}
                  value={data.condicionesContrato}
                  onChange={v => onChange("condicionesContrato", v)}
                />
              </FormField>
            </div>
          </div>
        </div>
      )}
      {esMercantil && (
        <div className="pmp-sub-block pmp-mt">
          <SubTitle>Oferta Mercantil</SubTitle>
          <div className="pmp-grid-3">
            <FormField label="Estado Oferta">
              <SelectField options={["Vigente", "Vencida", "Por vencer", "N.A."]} value={data.estadoOferta} onChange={v => onChange("estadoOferta", v)} />
            </FormField>
            <FormField label="Persona">
              <SelectField options={["Natural", "Jurídica", "N.A."]} value={data.tipoPersona} onChange={v => onChange("tipoPersona", v)} />
            </FormField>
            <FormField label="Modalidad Honorarios">
              <SelectField options={["RVG", "Tarifa Hora", "Valor Fijo", "RVG con mínimo garantizado", "RVG + tarifario", "N.A."]} value={data.modalidadHonorarios} onChange={v => onChange("modalidadHonorarios", v)} />
            </FormField>
            <FormField label="Fecha Firma">
              <InputField type="date" value={data.fechaFirmaOferta} onChange={v => onChange("fechaFirmaOferta", v)} />
            </FormField>
            <FormField label="Fecha Vencimiento">
              <InputField type="date" value={data.fechaVencOferta} onChange={v => onChange("fechaVencOferta", v)} />
            </FormField>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ─── SECCIÓN: INDUCCIONES Y ACCESOS ──────────────────────────────────────────
function SeccionInduccionesAcceso({ data, onChange, completitud }) {
  const inducciones = [
    { key: "indMedicaFSFB", label: "Inducción Médica FSFB" },
    { key: "indMedicaCHSM", label: "Inducción Médica CHSM" },
    { key: "indGeneralCHSM", label: "Inducción General CHSM" },
    { key: "indHISISIS", label: "Inducción HIS ISIS" },
    { key: "perfilCargo", label: "Perfil del Cargo" },
    { key: "entrenamiento", label: "Entrenamiento" },
  ];
  const accesos = [
    { key: "estadoCodigo", label: "Estado Código" },
    { key: "estadoCarnet", label: "Estado Carnet" },
    { key: "tarjetaAcceso", label: "Tarjeta de Acceso" },
    { key: "estadoBata", label: "Estado Bata" },
    { key: "entregaAlmera", label: "Entrega Almera" },
    { key: "entregaRUAF", label: "Entrega RUAF" },
    { key: "mipres", label: "MIPRES" },
    { key: "correoCorps", label: "Correo Corporativo" },
    { key: "cartaTurnos", label: "Carta de Turnos" },
  ];
  return (
    <SectionCard id="sec-inducciones" title="Inducciones, Accesos y Pólizas" subtitle="Cursos de ingreso y contratación" icon="badge" completitud={completitud}>
      <div className="pmp-grid-3 pmp-mb">
        {inducciones.map(f => (
          <FormField key={f.key} label={f.label}>
            <DocStatusSelect value={data[f.key]} onChange={v => onChange(f.key, v)} />
          </FormField>
        ))}
      </div>
      <div className="pmp-divider">
        <SubTitle>Accesos y Equipos</SubTitle>
        <div className="pmp-grid-4 pmp-mb">
          {accesos.map(f => (
            <FormField key={f.key} label={f.label}>
              <DocStatusSelect value={data[f.key]} onChange={v => onChange(f.key, v)} />
            </FormField>
          ))}
          <FormField label="Código SMM">
            <InputField value={data.codigoSMM} onChange={v => onChange("codigoSMM", v)} placeholder="SMM00000" />
          </FormField>
        </div>
        <SubTitle>Pólizas</SubTitle>
        <div className="pmp-grid-3">
          <FormField label="Póliza Resp. Civil">
            <DocStatusSelect value={data.polizaRespCivil} onChange={v => onChange("polizaRespCivil", v)} />
          </FormField>
          <FormField label="Fecha Venc. Póliza">
            <InputField type="date" value={data.fechaVencPoliza} onChange={v => onChange("fechaVencPoliza", v)} />
          </FormField>
          <FormField label="Póliza de Complicaciones">
            <DocStatusSelect value={data.polizaComplicaciones} onChange={v => onChange("polizaComplicaciones", v)} />
          </FormField>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── BARRA DE PROGRESO GLOBAL ─────────────────────────────────────────────────
function BarraProgresoGlobal({ completitud }) {
  const values = Object.values(completitud);
  const global = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const fill = pctColor(global);
  return (
    <div className="pmp-progress-bar">
      <div className="pmp-progress-left">
        <span className="pmp-progress-label">Completitud del Perfil</span>
        <div className="pmp-progress-track">
          <div className="pmp-progress-fill" style={{ width: `${global}%`, background: fill }} />
        </div>
      </div>
      <span className="pmp-progress-pct" style={{ color: fill }}>{global}%</span>
      <div className="pmp-progress-chips">
        {SECTIONS_CONFIG.map(s => {
          const pct = Math.round(completitud[s.key] ?? 0);
          const c = pctColor(pct);
          return (
            <span key={s.key} className="pmp-progress-chip" style={{ color: c, borderColor: `${c}40` }}>
              {pct}% <span className="pmp-chip-label">{s.label.split("·")[0].trim()}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function PerfilMedicoPage() {
  const { doc } = useParams();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("sec-datosGenerales");
  const [isSaving, setIsSaving] = useState(false);
  const [saveOk, setSaveOk] = useState(false);
  const contentRef = useRef(null);

  const [formData, setFormData] = useState({
    datosGenerales: {},
    datosPersonales: {},
    contacto: {},
    documentosHV: {},
    prerrogativas: {},
    diplomas: {},
    normativos: {},
    contratacion: {},
    inducciones: {},
  });

  const doctorName = doc ? `CC ${doc}` : "Nuevo Médico";

  const updateSection = useCallback((section, key, value) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  }, []);

  const completitud = useMemo(() => {
    const requeridos = {
      datosGenerales: ["categoria", "nombre", "especialidad", "deptCoord", "deptDM"],
      datosPersonales: ["autDatos", "tipoDoc", "cedula", "lugarExp", "fechaNac", "sexo"],
      contacto: ["correo", "telefono"],
      documentosHV: ["formSolIngreso", "formCapEdu", "cartaAspirante", "cartaPresEntDM"],
      prerrogativas: ["estadoPrerrogativas", "cartaAutCred", "cartaAutIngresoCME"],
      diplomas: ["pregrado_nombre", "esp1_nombre", "pregrado_verificacion"],
      normativos: ["bls_fecha", "acls_fecha", "tarjeta_rethus_estado", "consulta_rethus_estado"],
      contratacion: ["tipoVinculacion"],
      inducciones: ["indMedicaFSFB", "indMedicaCHSM", "indHISISIS"],
    };
    const result = {};
    for (const [section, campos] of Object.entries(requeridos)) {
      const d = formData[section] || {};
      result[section] = (campos.filter(c => d[c] && d[c] !== "").length / campos.length) * 100;
    }
    return result;
  }, [formData]);

  // Scrollspy con IntersectionObserver sobre el contenedor de scroll
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => { if (entry.isIntersecting) setActiveSection(entry.target.id); });
      },
      { root: container, rootMargin: "-80px 0px -65% 0px", threshold: 0 }
    );
    SECTIONS_CONFIG.forEach(s => {
      const el = container.querySelector(`#sec-${s.key}`);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollToSection = key => {
    const el = contentRef.current?.querySelector(`#sec-${key}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    setIsSaving(false);
    setSaveOk(true);
    setTimeout(() => setSaveOk(false), 3000);
  };

  const mk = section => (key, value) => updateSection(section, key, value);

  return (
    <div className="pmp-root">
      {/* Header */}
      <div className="pmp-header">
        <div className="pmp-header-left">
          <button className="pmp-back-btn" onClick={() => navigate(-1)} title="Volver">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="pmp-header-info">
            <h1 className="pmp-header-title">{doctorName}</h1>
            <span className="pmp-header-sub">Perfil Médico · Edición completa</span>
          </div>
        </div>
        <div className="pmp-header-right">
          {saveOk && (
            <span className="pmp-save-ok">
              <span className="material-symbols-outlined">check_circle</span>
              Guardado
            </span>
          )}
          <button className="pmp-btn-save" onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? <><span className="material-symbols-outlined pmp-spin">refresh</span> Guardando…</>
              : <><span className="material-symbols-outlined">save</span> Guardar Cambios</>
            }
          </button>
        </div>
      </div>

      {/* Barra de progreso global */}
      <BarraProgresoGlobal completitud={completitud} />

      {/* Body */}
      <div className="pmp-body">
        {/* Nav lateral */}
        <nav className="pmp-nav">
          {SECTIONS_CONFIG.map(s => {
            const pct = Math.round(completitud[s.key] ?? 0);
            const isActive = activeSection === `sec-${s.key}`;
            return (
              <button
                key={s.key}
                className={`pmp-nav-item${isActive ? " active" : ""}`}
                onClick={() => scrollToSection(s.key)}
              >
                <span className={`material-symbols-outlined${isActive ? " pmp-icon-filled" : ""}`}>{s.icon}</span>
                <span className="pmp-nav-label">{s.label}</span>
                <span className="pmp-nav-pct" style={{ color: pctColor(pct) }}>{pct}%</span>
              </button>
            );
          })}
        </nav>

        {/* Contenido scrollable */}
        <div className="pmp-content" ref={contentRef}>
          <SeccionDatosGenerales data={formData.datosGenerales} onChange={mk("datosGenerales")} completitud={completitud.datosGenerales} />
          <SeccionDatosPersonales data={formData.datosPersonales} onChange={mk("datosPersonales")} completitud={completitud.datosPersonales} />
          <SeccionContacto data={formData.contacto} onChange={mk("contacto")} completitud={completitud.contacto} />
          <SeccionDocumentosHV data={formData.documentosHV} onChange={mk("documentosHV")} completitud={completitud.documentosHV} />
          <SeccionPrerrogativas data={formData.prerrogativas} onChange={mk("prerrogativas")} completitud={completitud.prerrogativas} />
          <SeccionDiplomas data={formData.diplomas} onChange={mk("diplomas")} completitud={completitud.diplomas} />
          <SeccionNormativos data={formData.normativos} onChange={mk("normativos")} completitud={completitud.normativos} />
          <SeccionContratacion data={formData.contratacion} onChange={mk("contratacion")} completitud={completitud.contratacion} />
          <SeccionInduccionesAcceso data={formData.inducciones} onChange={mk("inducciones")} completitud={completitud.inducciones} />
          <p className="pmp-footer-note">
            Datos protegidos bajo Ley 1581 de 2012 · Habeas Data · Acceso restringido y auditado
          </p>
        </div>
      </div>
    </div>
  );
}
