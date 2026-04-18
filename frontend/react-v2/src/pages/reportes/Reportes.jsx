import { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

export default function Reportes() {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/reportes/exportar', {
        responseType: 'blob', // Importante para manejar archivos
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte_medicos.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (e) {
      setError('Hubo un error al intentar generar o descargar el reporte. ' + (e.message || ''));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ padding: '3rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
          Reportes y Exportaciones
        </h1>
        <p style={{ color: 'var(--color-on-surface-variant)', marginTop: '0.5rem' }}>
          Descarga la base de datos completa de médicos o ejecuta reportes de normativos.
        </p>
      </div>

      <div style={{ 
        background: 'white', 
        border: '1px solid rgba(197,198,210,0.4)', 
        borderRadius: 'var(--radius-xl)', 
        padding: '2rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
          <div style={{
            background: 'rgba(14,155,138,0.1)',
            padding: '1rem',
            borderRadius: 'var(--radius-xl)',
            color: 'var(--color-teal)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem' }}>table_view</span>
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-primary)' }}>
              Exportación Completa del Cuerpo Médico
            </h2>
            <p style={{ color: 'var(--color-gray-600)', marginTop: '0.5rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Genera un archivo Excel (.xlsx) con los datos consolidados de todos los médicos, 
              incluyendo información general, estado actual e información de contacto centralizada.
            </p>
            
            {error && (
              <div style={{ 
                background: 'var(--color-red-light)', 
                color: 'var(--color-red)', 
                padding: '0.75rem 1rem', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                fontSize: '0.875rem' 
              }}>
                {error}
              </div>
            )}

            <button 
              onClick={handleDownload}
              disabled={downloading}
              className="btn btn-signature"
              style={{ padding: '0.75rem 1.5rem' }}
            >
              {downloading ? (
                <>
                  <span className="material-symbols-outlined sm" style={{ animation: 'spin 1s linear infinite' }}>
                    progress_activity
                  </span>
                  Generando reporte...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined sm">download</span>
                  Descargar Excel XLSX
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
