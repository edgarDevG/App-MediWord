import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

/**
 * CampoSearchableSelectAsync
 * 
 * Componente que reemplaza un select estándar. Visualmente idéntico a fm-select.
 * Al hacer clic, abre un popover con un buscador (Free-solo) que consulta a 
 * OpenStreetMap (Nominatim). Si falla o no hay conexión, usa las opciones locales (fallbackOptions).
 */
export default function CampoSearchableSelectAsync({ 
  label, name, value, onChange, error, required, disabled, 
  fallbackOptions = [], placeholder = 'Seleccionar...' 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const containerRef = useRef(null);
  const selectWrapRef = useRef(null);
  const popoverRef = useRef(null);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = useCallback(() => {
    if (selectWrapRef.current && isOpen) {
      const rect = selectWrapRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom,
        left: rect.left,
        width: rect.width
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isOpen, updateCoords]);

  // Cerrar popover al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target) && (!popoverRef.current || !popoverRef.current.contains(e.target))) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Autofocus en el input cuando se abre el popover
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 50);
      setSearch(''); // Limpiar búsqueda al reabrir
      setOptions(fallbackOptions.slice(0, 50)); // Mostrar primeras locales por defecto
    }
  }, [isOpen, fallbackOptions]);

  // Manejar el cambio de búsqueda y disparar API (con debounce)
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearch(query);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setOptions(fallbackOptions.slice(0, 50));
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        // Consultar Nominatim (OpenStreetMap) buscando ciudades/pueblos/etc
        // Solo 10 resultados para no saturar. featuretype=settlement
        const res = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: query,
            format: 'json',
            limit: 10,
            addressdetails: 1,
            'accept-language': 'es' // Para que traiga nombres en español
          },
          timeout: 4000 // 4s timeout para saltar al fallback rápido
        });

        if (res.data && res.data.length > 0) {
          // Formatear resultados: "Ciudad, Estado, País"
          const apiOptions = res.data.map(item => {
            const addr = item.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || item.name;
            const state = addr.state || '';
            const country = addr.country || '';
            
            const labelParts = [city, state, country].filter(Boolean);
            // Evitar duplicados consecutivos (ej: "Bogota, Bogota, Colombia")
            const cleanLabel = [...new Set(labelParts)].join(', ');

            return { label: cleanLabel, value: cleanLabel };
          });
          
          // Eliminar posibles duplicados idénticos en el mapeo
          const uniqueApiOptions = [];
          const seen = new Set();
          apiOptions.forEach(opt => {
            if (!seen.has(opt.value)) {
              seen.add(opt.value);
              uniqueApiOptions.push(opt);
            }
          });

          setOptions(uniqueApiOptions);
        } else {
          // Si la API responde pero no hay resultados, buscar en fallback
          fallbackSearch(query);
        }
      } catch (err) {
        // Fallback en caso de error (sin internet o rate limit)
        fallbackSearch(query);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce
  };

  const fallbackSearch = (query) => {
    const q = query.toLowerCase();
    const filtered = fallbackOptions.filter(o => 
      String(o.label).toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q)
    );
    setOptions(filtered.slice(0, 30));
  };

  const handleSelect = (val) => {
    // Simulamos el evento onchange de un input/select
    onChange({ target: { name, value: val, type: 'select-one' } });
    setIsOpen(false);
  };

  // Buscamos si el valor actual tiene un label en los fallback (por si se está inicializando)
  let displayValue = value;
  if (value && fallbackOptions.length > 0) {
    const found = fallbackOptions.find(o => String(o.value) === String(value));
    if (found) displayValue = found.label;
  }

  // Comprobar si el texto buscado ya coincide exactamente con una de las opciones mostradas
  const isExactMatch = options.some(o => String(o.label).toLowerCase() === search.toLowerCase().trim() || String(o.value).toLowerCase() === search.toLowerCase().trim());

  return (
    <div className="form-group fm-field" ref={containerRef}>
      <label className={`form-label${required ? ' required' : ''}`} htmlFor={name}>
        {label}
      </label>
      <div className="fm-select-wrap" ref={selectWrapRef} style={{ position: 'relative' }}>
        
        {/* Disparador: Se ve idéntico al select normal */}
        <div 
          className={`form-select fm-select${error ? ' error' : ''}`}
          style={{ 
            cursor: disabled ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', minHeight: '38px',
            color: displayValue ? 'inherit' : '#94a3b8',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            paddingRight: '30px' // espacio para la flecha
          }}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          {displayValue || placeholder}
        </div>
        <span className="material-symbols-outlined fm-select-arrow" style={{ pointerEvents: 'none' }}>
          expand_more
        </span>
        
        {/* Popover en Portal */}
        {isOpen && typeof document !== 'undefined' && createPortal(
          <div ref={popoverRef} style={{
            position: 'fixed', top: coords.top + 4, left: coords.left, width: coords.width,
            background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            maxHeight: '300px'
          }}>
            {/* Buscador interno */}
            <div style={{ padding: '8px', borderBottom: '1px solid #e2e8f0', position: 'relative' }}>
              <input 
                ref={searchInputRef}
                type="text" 
                className="form-control fm-input"
                style={{ width: '100%', height: '34px', fontSize: '0.85rem', paddingRight: loading ? '30px' : '12px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none' }}
                placeholder="Buscar ciudad o país..."
                value={search}
                onChange={handleSearchChange}
              />
              {loading && (
                <span className="material-symbols-outlined" style={{ 
                  position: 'absolute', right: '16px', top: '15px', 
                  fontSize: '18px', color: '#94a3b8',
                  animation: 'spin 1s linear infinite' 
                }}>
                  sync
                </span>
              )}
            </div>
            
            {/* Lista de resultados */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '4px' }}>
              {/* Opción Free-Solo (Si escribió algo y no es exactamente igual a un resultado) */}
              {search.trim() && !isExactMatch && (
                <div 
                  style={{ 
                    padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', borderRadius: '4px', 
                    background: 'rgba(10,92,153,0.05)', color: 'var(--color-primary)',
                    marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                  onClick={() => handleSelect(search.trim())}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add_circle</span>
                  <strong>Usar "{search.trim()}"</strong>
                </div>
              )}

              {options.length > 0 ? options.map((opt, idx) => {
                const isSelected = String(value) === String(opt.value);
                return (
                  <div 
                    key={`${String(opt.value)}-${idx}`}
                    style={{ 
                      padding: '8px 12px', cursor: 'pointer', fontSize: '0.85rem', borderRadius: '4px',
                      background: isSelected ? 'rgba(10,92,153,0.1)' : 'transparent',
                      color: isSelected ? 'var(--color-primary)' : 'inherit',
                      fontWeight: isSelected ? 600 : 400
                    }}
                    onMouseEnter={(e) => { if(!isSelected) e.target.style.background = '#f8fafc' }}
                    onMouseLeave={(e) => { if(!isSelected) e.target.style.background = 'transparent' }}
                    onClick={() => handleSelect(opt.value)}
                  >
                    {String(opt.label)}
                  </div>
                );
              }) : (
                !search && <div style={{ padding: '12px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>Escribe para buscar...</div>
              )}
              {search && options.length === 0 && !loading && (
                <div style={{ padding: '12px', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                  Sin resultados automáticos
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
      
      {/* Estilos adicionales para animación si no existen */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
