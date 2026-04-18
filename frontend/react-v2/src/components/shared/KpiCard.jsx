import { Box, Typography } from '@mui/material';

export default function KpiCard({ label, value, trend, trendType = 'neutral', accentColor = '#0A2463', children }) {
  const trendColors = { up: '#0F6E56', down: '#A32D2D', warn: '#854F0B', neutral: '#888780' };
  return (
    <Box sx={{ bgcolor: '#fff', border: '0.5px solid #E0E3E7', borderRadius: 2.5, p: '14px 16px', display: 'flex', gap: 1.5, alignItems: 'stretch' }}>
      <Box sx={{ width: 3, borderRadius: 1, bgcolor: accentColor, flexShrink: 0 }} />
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5 }}>{label}</Typography>
        {children ? children : (
          <>
            <Typography sx={{ fontSize: 26, fontWeight: 500, color: accentColor, lineHeight: 1 }}>{value}</Typography>
            {trend && <Typography sx={{ fontSize: 11, color: trendColors[trendType], mt: 0.5 }}>{trend}</Typography>}
          </>
        )}
      </Box>
    </Box>
  );
}
