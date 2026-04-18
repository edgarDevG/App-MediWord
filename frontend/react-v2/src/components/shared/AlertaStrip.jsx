import { Box, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export default function AlertaStrip({ count = 0, onVerAlertas }) {
  if (count === 0) return null;
  return (
    <Box sx={{ bgcolor: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 2, px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <WarningAmberIcon sx={{ fontSize: 16, color: '#BA7517', flexShrink: 0 }} />
      <Typography sx={{ fontSize: 12, color: '#633806' }}>
        <strong>{count} {count === 1 ? 'alerta activa' : 'alertas activas'}:</strong> documentos próximos a vencer en los próximos 30 días
      </Typography>
      <Typography onClick={onVerAlertas} sx={{ fontSize: 12, color: '#633806', ml: 'auto', textDecoration: 'underline', cursor: 'pointer', flexShrink: 0 }}>
        Ver alertas →
      </Typography>
    </Box>
  );
}
