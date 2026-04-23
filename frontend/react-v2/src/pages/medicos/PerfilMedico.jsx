import { useParams } from 'react-router-dom';

export default function PerfilMedico() {
  const { doc } = useParams();
  return (
    <div style={{ padding: '3rem', textAlign: 'center' }}>
      <p style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626' }}>
        ROUTING OK — documento: "{doc}"
      </p>
    </div>
  );
}
