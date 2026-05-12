/* ══════════════════════════════════════════════════════════════
   FileUploadField.jsx — MediWork HSM
   Componente reutilizable para adjuntar archivos PDF.

   Props:
     carpeta         string    — 'hoja_vida' | 'ingreso' | 'prerrogativas' | …
     tiposPermitidos string[]  — tipos predefinidos para el select de tipo de doc
     maxArchivos     number    — máximo de archivos (1..n)
     medicoDoc       string    — documento del médico (cédula/pasaporte)
     label           string    — etiqueta visible sobre el campo
     compact         bool      — variante inline (icono toggle) vs tarjeta completa
     campoRef        string    — referencia al campo padre (trazabilidad)

   Integración backend:
     POST   /api/v1/medicos/{doc}/archivos/          — subir
     GET    /api/v1/medicos/{doc}/archivos/?campo_ref=… — cargar al montar
     DELETE /api/v1/medicos/{doc}/archivos/{id}/     — eliminación lógica
     GET    /api/v1/medicos/{doc}/archivos/{id}/file — descargar
══════════════════════════════════════════════════════════════ */

import { useState, useRef, useId, useEffect, useCallback } from 'react';
import axiosInstance from '../../api/axiosInstance';

/* ── Constantes ── */
const ACCEPTED     = '.pdf,application/pdf';
const MAX_SIZE_MB  = 10;
const MAX_SIZE_B   = MAX_SIZE_MB * 1024 * 1024;

/* ── Utilidades ── */
function formatBytes(bytes) {
  if (!bytes) return '';
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Sub-componentes visuales ── */
function TipoBadge({ tipo }) {
  if (!tipo) return null;
  return (
    <span style={{
      fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px',
      borderRadius: 'var(--radius-full)', background: 'rgba(26,78,215,0.08)',
      color: 'var(--color-secondary)', whiteSpace: 'nowrap',
    }}>{tipo}</span>
  );
}

function StatusBadge({ subido }) {
  return subido ? (
    <span style={{
      fontSize: '0.6875rem', fontWeight: 600, padding: '1px 6px',
      borderRadius: 'var(--radius-full)',
      background: 'rgba(22,163,74,0.1)', color: '#14532d',
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>check_circle</span>
      Guardado
    </span>
  ) : (
    <span style={{
      fontSize: '0.6875rem', fontWeight: 600, padding: '1px 6px',
      borderRadius: 'var(--radius-full)',
      background: 'rgba(245,158,11,0.1)', color: '#92400e',
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 11 }}>schedule</span>
      Pendiente de subir
    </span>
  );
}

function ArchivoItem({ archivo, onRemove, onDownload, showTipo = false, uploading = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 12px',
      background: archivo.subido ? 'rgba(22,163,74,0.04)' : 'rgba(26,78,215,0.04)',
      border: `1px solid ${archivo.subido ? 'rgba(22,163,74,0.15)' : 'rgba(26,78,215,0.12)'}`,
      borderRadius: 'var(--radius-lg)',
      transition: 'all 160ms',
      opacity: uploading ? 0.6 : 1,
    }}>
      <span
        className="material-symbols-outlined"
        style={{ fontSize: 18, color: archivo.subido ? '#16a34a' : 'var(--color-secondary)', flexShrink: 0, cursor: archivo.subido ? 'pointer' : 'default' }}
        title={archivo.subido ? 'Ver / Descargar' : undefined}
        onClick={archivo.subido ? () => onDownload(archivo) : undefined}
      >
        picture_as_pdf
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '0.8125rem', fontWeight: 600,
          color: 'var(--color-primary)', margin: 0,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{archivo.nombre}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
          {archivo.tamano > 0 && (
            <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>{formatBytes(archivo.tamano)}</span>
          )}
          {showTipo && archivo.tipo && <TipoBadge tipo={archivo.tipo} />}
          {uploading
            ? <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>Subiendo…</span>
            : <StatusBadge subido={archivo.subido} />
          }
        </div>
      </div>
      <button
        type="button"
        onClick={() => onRemove(archivo)}
        title={archivo.subido ? 'Eliminar del servidor' : 'Quitar'}
        disabled={uploading}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', padding: 4,
          borderRadius: 'var(--radius-md)', color: '#94a3b8',
          transition: 'color 160ms, background 160ms', flexShrink: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-error)'; e.currentTarget.style.background = 'rgba(186,26,26,0.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent'; }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
      </button>
    </div>
  );
}

function DropZone({ inputId, fileInputRef, dragging, setDragging, handleDrop, handleFileInput, puedeAgregarMas, maxArchivos, compact = false }) {
  if (!puedeAgregarMas) return null;
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      style={{
        border: `1px dashed ${dragging ? 'var(--color-secondary)' : 'rgba(148,163,184,0.5)'}`,
        borderRadius: 'var(--radius-lg)',
        background: dragging ? 'rgba(26,78,215,0.04)' : 'rgba(248,250,252,0.6)',
        padding: compact ? '10px 12px' : '16px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8, cursor: 'pointer', transition: 'all 160ms', userSelect: 'none',
      }}
    >
      <span className="material-symbols-outlined"
        style={{ fontSize: compact ? 18 : 22, color: dragging ? 'var(--color-secondary)' : '#94a3b8' }}>
        upload_file
      </span>
      <div>
        <p style={{ fontSize: compact ? '0.75rem' : '0.8125rem', fontWeight: 600, color: '#475569', margin: 0 }}>
          {compact ? 'Subir PDF' : 'Arrastra o haz clic para subir'}
        </p>
        {!compact && (
          <p style={{ fontSize: '0.6875rem', color: '#94a3b8', margin: '2px 0 0' }}>
            PDF · máx. {maxArchivos === 1 ? '1 archivo' : `${maxArchivos} archivos`} · 10 MB c/u
          </p>
        )}
      </div>
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED}
        multiple={maxArchivos > 1}
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
      padding: '6px 10px', borderRadius: 'var(--radius-md)',
      background: 'rgba(186,26,26,0.06)', border: '1px solid rgba(186,26,26,0.15)',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--color-error)', flexShrink: 0 }}>error</span>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-error)', fontWeight: 500, margin: 0 }}>{msg}</p>
    </div>
  );
}

/* ══ COMPONENTE PRINCIPAL ════════════════════════════════════ */
export default function FileUploadField({
  carpeta,
  tiposPermitidos = [],
  maxArchivos = 1,
  medicoDoc,
  label,
  compact = false,
  campoRef = '',
}) {
  const inputId      = useId();
  const fileInputRef = useRef(null);

  /* archivos: { id, nombre, tamano, tipo, file?, subido, backendId? } */
  const [archivos,   setArchivos]  = useState([]);
  const [error,      setError]     = useState(null);
  const [dragging,   setDragging]  = useState(false);
  const [expanded,   setExpanded]  = useState(!compact);
  const [loading,    setLoading]   = useState(false);   // cargando lista inicial
  const [uploading,  setUploading] = useState(false);   // subiendo un archivo

  const puedeAgregarMas = archivos.length < maxArchivos;

  /* ── Cargar archivos existentes al montar ── */
  useEffect(() => {
    if (!medicoDoc || !carpeta) return;
    const params = new URLSearchParams({ carpeta });
    if (campoRef) params.append('campo_ref', campoRef);

    setLoading(true);
    axiosInstance
      .get(`/medicos/${medicoDoc}/archivos/?${params.toString()}`)
      .then(res => {
        const items = (res.data || []).map(a => ({
          id:        `back-${a.id}`,
          backendId: a.id,
          nombre:    a.nombre_original,
          tamano:    a.tamano_bytes || 0,
          tipo:      a.tipo_doc || '',
          subido:    true,
          urlDescarga: a.url_descarga,
        }));
        setArchivos(items);
      })
      .catch(() => { /* silencioso — médico nuevo sin archivos */ })
      .finally(() => setLoading(false));
  }, [medicoDoc, carpeta, campoRef]);

  /* ── Validar y subir archivo inmediatamente tras selección ── */
  const procesarArchivos = useCallback(async (fileList) => {
    setError(null);
    const files = Array.from(fileList);

    for (const file of files) {
      if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('Solo se permiten archivos PDF.');
        return;
      }
      if (file.size > MAX_SIZE_B) {
        setError(`"${file.name}" supera el límite de ${MAX_SIZE_MB} MB.`);
        return;
      }
      if (archivos.length >= maxArchivos) {
        setError(`Máximo ${maxArchivos} archivo${maxArchivos > 1 ? 's' : ''} permitido${maxArchivos > 1 ? 's' : ''}.`);
        return;
      }

      const tempId = `tmp-${Date.now()}-${Math.random()}`;

      /* Optimistic: mostrar como "pendiente" inmediatamente */
      setArchivos(prev => [...prev, {
        id: tempId, nombre: file.name, tamano: file.size,
        tipo: tiposPermitidos.length === 1 ? tiposPermitidos[0] : '',
        file, subido: false,
      }]);

      /* Subir al backend */
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('archivo', file, file.name);
        fd.append('carpeta', carpeta);
        if (campoRef) fd.append('campo_ref', campoRef);
        if (tiposPermitidos.length === 1) fd.append('tipo_doc', tiposPermitidos[0]);

        const { data } = await axiosInstance.post(
          `/medicos/${medicoDoc}/archivos/`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );

        /* Reemplazar entrada temporal con la del servidor */
        setArchivos(prev => prev.map(a =>
          a.id === tempId
            ? {
                id:          `back-${data.id}`,
                backendId:   data.id,
                nombre:      data.nombre_original,
                tamano:      data.tamano_bytes || file.size,
                tipo:        data.tipo_doc || '',
                subido:      true,
                urlDescarga: data.url_descarga,
              }
            : a
        ));
      } catch (err) {
        /* Revertir entrada temporal */
        setArchivos(prev => prev.filter(a => a.id !== tempId));
        const msg = err?.response?.data?.detail || 'Error al subir el archivo.';
        setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  }, [archivos.length, carpeta, campoRef, maxArchivos, medicoDoc, tiposPermitidos]);

  const handleFileInput = (e) => procesarArchivos(e.target.files);
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); procesarArchivos(e.dataTransfer.files); };

  /* ── Eliminar archivo ── */
  const handleRemove = async (archivo) => {
    setError(null);
    if (archivo.subido && archivo.backendId) {
      try {
        await axiosInstance.delete(`/medicos/${medicoDoc}/archivos/${archivo.backendId}/`);
      } catch (err) {
        setError('No se pudo eliminar el archivo del servidor.');
        return;
      }
    }
    setArchivos(prev => prev.filter(a => a.id !== archivo.id));
  };

  /* ── Descargar archivo ── */
  const handleDownload = (archivo) => {
    if (!archivo.urlDescarga) return;
    const base = axiosInstance.defaults.baseURL || '';
    window.open(`${base}${archivo.urlDescarga}`, '_blank');
  };

  /* ── Cambiar tipo de un archivo local ── */
  const handleTipoChange = (id, tipo) => {
    setArchivos(prev => prev.map(a => a.id === id ? { ...a, tipo } : a));
  };

  /* ── Render lista de archivos ── */
  const renderLista = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 4 : 6, marginTop: compact ? 8 : 10 }}>
      {archivos.map(a => (
        <div key={a.id}>
          {!a.subido && tiposPermitidos.length > 1 && (
            <div style={{ marginBottom: 4 }}>
              <select
                className="form-select"
                value={a.tipo}
                onChange={e => handleTipoChange(a.id, e.target.value)}
                style={{ fontSize: compact ? '0.75rem' : '0.8125rem', padding: compact ? '4px 8px' : undefined, height: compact ? 'auto' : undefined }}
              >
                <option value="">Tipo de documento…</option>
                {tiposPermitidos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <ArchivoItem
            archivo={a}
            onRemove={handleRemove}
            onDownload={handleDownload}
            showTipo={!compact || tiposPermitidos.length <= 1}
            uploading={uploading && !a.subido}
          />
        </div>
      ))}
    </div>
  );

  /* ── Variante compact ── */
  if (compact) {
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <button
          type="button"
          title={label || 'Adjuntar archivo'}
          onClick={() => setExpanded(p => !p)}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 'var(--radius-lg)',
            border: archivos.length > 0 ? '1px solid rgba(26,78,215,0.25)' : '1px dashed rgba(148,163,184,0.5)',
            background: archivos.length > 0 ? 'rgba(26,78,215,0.06)' : 'transparent',
            cursor: 'pointer', transition: 'all 160ms',
            color: archivos.length > 0 ? 'var(--color-secondary)' : '#94a3b8',
            fontSize: '0.75rem', fontWeight: 600,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(26,78,215,0.4)'; e.currentTarget.style.color = 'var(--color-secondary)'; }}
          onMouseLeave={e => {
            if (archivos.length === 0) {
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.5)';
              e.currentTarget.style.color = '#94a3b8';
            }
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>attach_file</span>
          {loading ? '…' : archivos.length > 0 ? `${archivos.length} PDF` : 'Adjuntar'}
        </button>

        {expanded && (
          <div style={{
            marginTop: 4, padding: 12, minWidth: 280,
            background: '#fff', border: '1px solid rgba(197,198,210,0.5)',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-md)',
            zIndex: 10, position: 'relative',
          }}>
            <DropZone
              inputId={inputId} fileInputRef={fileInputRef}
              dragging={dragging} setDragging={setDragging}
              handleDrop={handleDrop} handleFileInput={handleFileInput}
              puedeAgregarMas={puedeAgregarMas && !uploading}
              maxArchivos={maxArchivos} compact
            />
            {error && <ErrorMsg msg={error} />}
            {archivos.length > 0 && renderLista()}
          </div>
        )}
      </div>
    );
  }

  /* ── Variante completa (tarjeta) ── */
  return (
    <div style={{ width: '100%' }}>
      {label && <label className="form-label" style={{ marginBottom: 6 }}>{label}</label>}

      {loading ? (
        <div style={{ padding: '10px 0', fontSize: '0.8125rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>autorenew</span>
          Cargando archivos…
        </div>
      ) : (
        <DropZone
          inputId={inputId} fileInputRef={fileInputRef}
          dragging={dragging} setDragging={setDragging}
          handleDrop={handleDrop} handleFileInput={handleFileInput}
          puedeAgregarMas={puedeAgregarMas && !uploading}
          maxArchivos={maxArchivos}
        />
      )}

      {error && <ErrorMsg msg={error} />}
      {archivos.length > 0 && renderLista()}

      {!puedeAgregarMas && (
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: 'middle', marginRight: 3 }}>info</span>
          Límite de {maxArchivos} archivo{maxArchivos > 1 ? 's' : ''} alcanzado.
        </p>
      )}
    </div>
  );
}
