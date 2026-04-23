/* eslint-disable react-refresh/only-export-components */
/**
 * DoctorAvatar — Avatar circular con iniciales del médico.
 * Colores basados en categoría (valor semántico en este dominio).
 * Fallback a paleta por hash del nombre cuando no hay categoría.
 */

export const CAT_COLORS = {
  A:   { bg: 'rgba(26,78,215,0.15)',  color: '#1a4ed7' },
  AE:  { bg: 'rgba(109,40,217,0.15)', color: '#7c3aed' },
  AP:  { bg: 'rgba(4,120,87,0.15)',   color: '#047857' },
  C:   { bg: 'rgba(180,83,9,0.15)',   color: '#b45309' },
  E:   { bg: 'rgba(190,18,60,0.15)',  color: '#be123c' },
  H:   { bg: 'rgba(7,89,133,0.15)',   color: '#075985' },
  I:   { bg: 'rgba(120,53,15,0.15)',  color: '#92400e' },
  PSI: { bg: 'rgba(20,83,45,0.15)',   color: '#166534' },
  PE:  { bg: 'rgba(0,105,92,0.15)',   color: '#00695c' },
  N:   { bg: 'rgba(71,85,105,0.15)',  color: '#475569' },
};

const HASH_PALETTE = [
  { bg: 'rgba(26,78,215,0.15)',  color: '#1a4ed7' },
  { bg: 'rgba(4,120,87,0.15)',   color: '#047857' },
  { bg: 'rgba(109,40,217,0.15)', color: '#7c3aed' },
  { bg: 'rgba(180,83,9,0.15)',   color: '#b45309' },
  { bg: 'rgba(7,89,133,0.15)',   color: '#075985' },
  { bg: 'rgba(190,18,60,0.15)',  color: '#be123c' },
  { bg: 'rgba(20,83,45,0.15)',   color: '#166534' },
  { bg: 'rgba(0,105,92,0.15)',   color: '#00695c' },
];

function hashName(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return HASH_PALETTE[h % HASH_PALETTE.length];
}

export function getAvatarColor(cat, name) {
  return CAT_COLORS[cat] ?? hashName(name);
}

export function getInitials(name) {
  if (!name) return '?';
  const clean = name.replace(/^Dr[a]?\.?\s+/i, '').trim();
  const parts  = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * @param {string}  name  — Nombre completo del médico
 * @param {string}  cat   — Código de categoría (A|AE|AP|…)
 * @param {number}  size  — Diámetro en px (default 40)
 * @param {number}  radius — Border radius en px (default 11)
 */
export default function DoctorAvatar({ name, cat, size = 40, radius = 11 }) {
  const col      = getAvatarColor(cat, name);
  const fontSize = size <= 40 ? '0.8125rem' : size <= 60 ? '1.125rem' : '1.75rem';

  return (
    <div style={{
      width: size, height: size,
      borderRadius: radius,
      flexShrink: 0,
      background: col.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <span style={{
        fontSize,
        fontWeight: 800,
        color: col.color,
        letterSpacing: '-0.02em',
        lineHeight: 1,
        userSelect: 'none',
      }}>
        {getInitials(name)}
      </span>
    </div>
  );
}
