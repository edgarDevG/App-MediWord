import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

/* ─── datos del panel izquierdo ─────────────────────────────── */
const STATS = [
  { value: '286', label: 'profesionales activos' },
  { value: '18',  label: 'servicios clínicos'    },
  { value: '7min', label: 'respuesta promedio'   },
];

const ACTIVITIES = [
  { time: '08:42', kind: 'success', title: 'Credentialing validado',  detail: 'Cardiología · Dr. Morales'      },
  { time: '08:31', kind: 'info',    title: 'Turno crítico cubierto',  detail: 'UCI Adultos · 12 h nocturnas'  },
  { time: '08:18', kind: 'warning', title: 'Revisión pendiente',      detail: 'Pediatría · 2 documentos'      },
];

/* ─── subcomponentes ─────────────────────────────────────────── */
function LogoMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
        background: 'linear-gradient(145deg, #13c7a6, #05a6bf)',
        boxShadow: '0 14px 32px rgba(0,194,163,.32), inset 0 1px 0 rgba(255,255,255,.35)',
        display: 'grid', placeItems: 'center', position: 'relative',
        animation: 'lgn-pulse 3.4s ease-in-out infinite',
      }}>
        <svg viewBox="0 0 32 32" fill="none" width="22" height="22">
          <rect x="13" y="4" width="6" height="24" rx="2" fill="white"/>
          <rect x="4" y="13" width="24" height="6" rx="2" fill="white"/>
        </svg>
      </div>
      <div>
        <strong style={{ display: 'block', fontSize: '1rem', color: '#f6fbff', letterSpacing: '-0.03em' }}>
          MediWord HSM
        </strong>
        <span style={{
          display: 'block', marginTop: 2,
          fontSize: '0.68rem', fontWeight: 800,
          color: 'rgba(246,251,255,.5)', letterSpacing: '0.11em', textTransform: 'uppercase',
        }}>
          Hospital Serena del Mar
        </span>
      </div>
    </div>
  );
}

/* ─── componente principal ───────────────────────────────────── */
export default function Login() {
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [loading,    setLoading]    = useState(false);
  const [showPass,   setShowPass]   = useState(false);
  const [showHelp,   setShowHelp]   = useState(false);
  const [focusEmail, setFocusEmail] = useState(false);
  const [focusPass,  setFocusPass]  = useState(false);

  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Sesión iniciada correctamente');
      navigate('/');
    } catch {
      toast.error('Credenciales inválidas. Verifica tus datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* ── reset & base ─────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root { height: 100%; overflow: hidden; }

        /* ── tokens ──────────────────────────────── */
        :root {
          --navy:      #071a2f;
          --navy2:     #102a4a;
          --teal:      #13c7a6;
          --teal-dark: #06937f;
          --cyan:      #70d6ff;
          --violet:    #5961d9;
          --warning:   #efad43;
          --success:   #22b883;
          --ink:       #0b152b;
          --ink2:      #1b2946;
          --muted:     #66738b;
          --line:      #d8e2eb;
          font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
        }

        /* ── animations ──────────────────────────── */
        @keyframes lgn-shell   { from { opacity:0; transform:scale(.985); }  to { opacity:1; transform:scale(1); } }
        @keyframes lgn-form    { from { opacity:0; transform:translateX(14px); } to { opacity:1; transform:translateX(0); } }
        @keyframes lgn-spin    { to   { transform:rotate(360deg); } }
        @keyframes lgn-pulse   { 0%,100% { box-shadow:0 14px 32px rgba(0,194,163,.28),inset 0 1px 0 rgba(255,255,255,.35); } 50% { box-shadow:0 20px 44px rgba(0,194,163,.42),inset 0 1px 0 rgba(255,255,255,.35); } }
        @keyframes lgn-orbit   { to { transform:rotate(360deg); } }
        @keyframes lgn-rotate  { to { transform:rotate(360deg); } }
        @keyframes lgn-drift   { from { transform:translate3d(0,0,0) scale(1); } to { transform:translate3d(26px,-16px,0) scale(1.07); } }
        @keyframes lgn-rise    { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lgn-row     { from { opacity:0; transform:translateY(8px); }  to { opacity:1; transform:translateY(0); } }

        /* ── page wrapper ────────────────────────── */
        .lgn-page {
          height: 100vh;
          display: grid;
          place-items: stretch;
          background: var(--navy);
          overflow: hidden;
          position: relative;
        }
        .lgn-page::before, .lgn-page::after {
          content: '';
          position: absolute;
          border-radius: 999px;
          filter: blur(12px);
          opacity: .55;
          pointer-events: none;
          animation: lgn-drift 12s ease-in-out infinite alternate;
        }
        .lgn-page::before {
          width: 340px; height: 340px;
          left: -130px; bottom: -110px;
          background: rgba(19,199,166,.22);
        }
        .lgn-page::after {
          width: 400px; height: 400px;
          right: -110px; top: -150px;
          background: rgba(89,97,217,.16);
          animation-delay: -4s;
        }

        /* ── shell (2-col grid) ──────────────────── */
        .lgn-shell {
          width: 100%; height: 100vh;
          display: grid;
          grid-template-columns: minmax(0,1fr) clamp(340px,30vw,500px);
          overflow: hidden;
          background: white;
          position: relative; z-index: 1;
          animation: lgn-shell .7s cubic-bezier(.2,.9,.2,1) both;
        }

        /* ── left brand panel ────────────────────── */
        .lgn-brand {
          color: #f6fbff;
          padding: clamp(28px,4vw,64px);
          position: relative;
          overflow: hidden;
          display: flex; flex-direction: column;
          background:
            radial-gradient(circle at 84% 12%, rgba(19,199,166,.2), transparent 30%),
            radial-gradient(circle at 20% 90%, rgba(89,97,217,.28), transparent 34%),
            linear-gradient(155deg, #081523 0%, #102848 62%, #172058 100%);
        }
        .lgn-brand::before {
          content: '';
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(112,214,255,.09) 1px, transparent 1px),
            linear-gradient(90deg, rgba(112,214,255,.09) 1px, transparent 1px);
          background-size: 26px 26px;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,.9), rgba(0,0,0,.4));
        }
        .lgn-brand::after {
          content: '';
          position: absolute; inset: -20%;
          background: conic-gradient(from 190deg, transparent, rgba(19,199,166,.22), transparent, rgba(112,214,255,.16), transparent);
          animation: lgn-rotate 24s linear infinite;
          opacity: .55;
        }
        .lgn-brand-content { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; }

        /* eyebrow chip */
        .lgn-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 12px;
          border: 1px solid rgba(112,214,255,.22);
          border-radius: 999px;
          color: rgba(221,245,255,.86);
          background: rgba(255,255,255,.055);
          backdrop-filter: blur(12px);
          font-size: .72rem; font-weight: 800;
          letter-spacing: .08em; text-transform: uppercase;
          width: fit-content;
        }
        .lgn-eyebrow::before {
          content: ''; width: 7px; height: 7px;
          border-radius: 99px;
          background: var(--teal);
          box-shadow: 0 0 14px var(--teal);
        }

        /* headline */
        .lgn-brand h1 {
          margin: 18px 0 14px;
          font-size: clamp(1.9rem,3.6vw,3.4rem);
          letter-spacing: -.06em;
          line-height: .94;
          font-weight: 800;
        }
        .lgn-brand p.desc {
          margin: 0; max-width: 50ch;
          color: rgba(235,245,255,.7);
          font-size: clamp(.85rem,1.2vw,1rem);
          line-height: 1.65;
        }

        /* orbit / activity visual */
        .lgn-visual {
          position: relative;
          margin-top: auto;
          min-height: 240px;
          display: grid; place-items: center;
          flex-shrink: 0;
        }
        .lgn-orbit {
          position: absolute;
          border: 1px solid rgba(112,214,255,.18);
          border-radius: 999px;
          animation: lgn-orbit 18s linear infinite;
        }
        .lgn-orbit.o1 { width: 260px; height: 260px; }
        .lgn-orbit.o2 { width: 370px; height: 170px; transform:rotate(-14deg); animation-duration:25s; }
        .lgn-orbit.o3 { width: 480px; height: 210px; transform:rotate(22deg);  animation-duration:31s; }
        .lgn-node {
          position: absolute;
          width: 10px; height: 10px; border-radius: 50%;
          background: var(--cyan); box-shadow: 0 0 16px var(--cyan);
        }
        .lgn-node.na { top: 20%; left: 30%; }
        .lgn-node.nb { top: 58%; right: 22%; background: var(--teal); box-shadow: 0 0 16px var(--teal); }
        .lgn-node.nc { bottom: 20%; left: 44%; background: var(--violet); box-shadow: 0 0 16px var(--violet); }

        /* activity card */
        .lgn-card {
          width: min(480px, 90%);
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 20px;
          background: rgba(8,22,39,.62);
          box-shadow: 0 20px 50px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.1);
          backdrop-filter: blur(16px);
          overflow: hidden;
          animation: lgn-rise .8s .16s cubic-bezier(.2,.9,.2,1) both;
        }
        .lgn-card-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,.1);
          font-size: .88rem; font-weight: 700;
        }
        .lgn-status-pill {
          display: inline-flex; align-items: center; gap: 7px;
          color: rgba(238,255,250,.88); font-size: .72rem; font-weight: 800;
        }
        .lgn-status-pill::before {
          content: ''; width: 7px; height: 7px; border-radius: 999px;
          background: var(--teal); box-shadow: 0 0 0 5px rgba(19,199,166,.13);
        }
        .lgn-act-list { list-style: none; padding: 8px 16px 16px; display: grid; gap: 10px; }
        .lgn-act-list li {
          display: grid; grid-template-columns: auto 1fr; gap: 10px;
          align-items: start; color: rgba(246,251,255,.8);
          animation: lgn-row .65s ease both;
        }
        .lgn-act-list li:nth-child(2) { animation-delay:.1s; }
        .lgn-act-list li:nth-child(3) { animation-delay:.2s; }
        .lgn-act-time { font-variant-numeric: tabular-nums; color: rgba(235,245,255,.4); font-size: .72rem; padding-top: 2px; }
        .lgn-act-title { display: flex; align-items: center; gap: 7px; font-weight: 720; font-size: .82rem; }
        .lgn-act-detail { margin-top: 2px; color: rgba(235,245,255,.48); font-size: .72rem; }
        .lgn-dot { width: 7px; height: 7px; border-radius: 999px; display: inline-block; }
        .lgn-dot.success { background: var(--success); box-shadow: 0 0 12px var(--success); }
        .lgn-dot.info    { background: var(--cyan);    box-shadow: 0 0 12px var(--cyan);    }
        .lgn-dot.warning { background: var(--warning); box-shadow: 0 0 12px var(--warning); }

        /* ── right form panel ────────────────────── */
        .lgn-form-panel {
          position: relative;
          display: grid; align-content: center;
          padding: clamp(22px,3.5vw,48px);
          overflow: hidden;
          background:
            radial-gradient(circle at 92% 8%, rgba(19,199,166,.07), transparent 26%),
            linear-gradient(180deg, rgba(255,255,255,.98), rgba(248,251,253,.94));
          box-shadow: -16px 0 40px rgba(7,26,47,.12);
        }
        .lgn-secure {
          position: absolute; right: clamp(16px,2.5vw,32px); top: clamp(14px,2.5vw,24px);
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--teal-dark); font-size: .72rem; font-weight: 760;
          padding: 8px 11px;
          border: 1px solid rgba(19,199,166,.22);
          background: rgba(235,255,250,.74);
          border-radius: 999px;
        }
        .lgn-form-wrap {
          width: min(100%, 400px);
          margin-inline: auto;
          animation: lgn-form .75s .07s cubic-bezier(.2,.9,.2,1) both;
        }
        .lgn-kicker {
          color: var(--teal-dark);
          font-size: .7rem; font-weight: 850;
          text-transform: uppercase; letter-spacing: .12em;
          margin: 0 0 10px;
        }
        .lgn-form-wrap h2 {
          margin: 0;
          font-size: clamp(1.7rem,2.6vw,2.4rem);
          line-height: 1.05; letter-spacing: -.045em;
          color: var(--ink);
        }
        .lgn-subhead {
          margin: 12px 0 24px;
          color: var(--muted);
          font-size: .9rem; line-height: 1.6;
        }

        /* form fields */
        .lgn-field { display: grid; gap: 7px; }
        .lgn-field + .lgn-field { margin-top: 14px; }
        .lgn-label {
          font-size: .7rem; font-weight: 850;
          color: var(--ink2);
          text-transform: uppercase; letter-spacing: .08em;
        }
        .lgn-input-shell {
          display: grid; grid-template-columns: auto 1fr auto;
          align-items: center; min-height: 52px;
          border: 1.5px solid var(--line);
          border-radius: 14px;
          background: #f6f9fc; color: #94a3b8;
          padding: 0 14px;
          transition: border-color .18s ease, box-shadow .18s ease, background .18s ease, transform .18s ease;
        }
        .lgn-input-shell.focused {
          border-color: rgba(19,199,166,.7);
          box-shadow: 0 0 0 4px rgba(19,199,166,.12);
          background: #fff;
          transform: translateY(-1px);
        }
        .lgn-input-shell input {
          width: 100%; min-width: 0;
          border: 0; outline: 0;
          background: transparent;
          color: var(--ink);
          padding: 0 10px;
          font-size: .88rem;
          font-family: inherit;
        }
        .lgn-input-shell input::placeholder { color: #94a3b8; }
        .lgn-ghost {
          border: 0; background: transparent;
          color: var(--teal-dark); font-size: .76rem; font-weight: 780;
          cursor: pointer; padding: 3px 0;
        }
        .lgn-ghost:hover { color: #057365; text-decoration: underline; text-underline-offset: 3px; }

        /* submit */
        .lgn-submit {
          margin-top: 20px;
          width: 100%; min-height: 52px;
          border: 0; border-radius: 15px;
          color: white; cursor: pointer; font-weight: 850;
          font-family: inherit; font-size: .9rem;
          background: linear-gradient(135deg, var(--navy), #12375f 68%, #086c69);
          box-shadow: 0 14px 30px rgba(7,26,47,.22);
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
          display: flex; align-items: center; justify-content: center; gap: 9px;
        }
        .lgn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(7,26,47,.28);
          filter: saturate(1.06);
        }
        .lgn-submit:active { transform: translateY(0); }
        .lgn-submit:disabled { opacity: .7; cursor: not-allowed; }

        /* stats row */
        .lgn-stats {
          margin-top: 22px; padding-top: 18px;
          border-top: 1px solid var(--line);
          display: grid; grid-template-columns: repeat(3,1fr); gap: 8px;
        }
        .lgn-stats strong { display: block; color: var(--ink); font-size: .98rem; letter-spacing: -.03em; }
        .lgn-stats span   { display: block; margin-top: 2px; color: var(--muted); font-size: .66rem; line-height: 1.35; }

        /* help box */
        .lgn-help-box {
          margin-top: 10px; padding: 13px 15px;
          background: rgba(10,37,64,.04);
          border: 1px solid rgba(10,37,64,.1);
          border-left: 3px solid #0A2540;
          border-radius: 12px;
        }

        /* ── mobile ──────────────────────────────── */
        .lgn-mobile-logo { display: none; margin-bottom: 28px; }

        @media (max-width: 900px) {
          html, body, #root { overflow: auto; }
          .lgn-page { height: auto; min-height: 100svh; overflow: auto; }
          .lgn-shell { grid-template-columns: 1fr; height: auto; min-height: 100svh; }
          .lgn-brand { display: none; }
          .lgn-form-panel { min-height: 100svh; align-content: center; }
          .lgn-mobile-logo { display: flex; align-items: center; gap: 12px; }
          .lgn-secure { position: static; margin-bottom: 16px; }
        }

        @media (max-width: 480px) {
          .lgn-form-panel { padding: 20px; }
          .lgn-stats { grid-template-columns: 1fr; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: .01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: .01ms !important;
          }
        }
      `}</style>

      <main className="lgn-page">
        <section className="lgn-shell" aria-label="Inicio de sesión MediWord HSM">

          {/* ══ PANEL IZQUIERDO ══════════════════════════════════════ */}
          <aside className="lgn-brand" aria-label="Sistema de gestión del cuerpo médico">
            <div className="lgn-brand-content">
              <LogoMark />

              <div style={{ marginTop: 'clamp(40px,8vh,90px)', maxWidth: 580 }}>
                <span className="lgn-eyebrow">Centro de mando hospitalario</span>
                <h1>Talento médico,<br />disponible y verificado.</h1>
                <p className="desc">
                  Administra credenciales, habilitaciones, normativos y estadísticas
                  del personal médico con trazabilidad institucional.
                </p>
              </div>

              {/* Visual interactivo */}
              <div className="lgn-visual" aria-hidden="true">
                <span className="lgn-orbit o1" />
                <span className="lgn-orbit o2" />
                <span className="lgn-orbit o3" />
                <span className="lgn-node na" />
                <span className="lgn-node nb" />
                <span className="lgn-node nc" />

                <div className="lgn-card">
                  <div className="lgn-card-head">
                    <strong>Actividad en vivo</strong>
                    <span className="lgn-status-pill">Operación estable</span>
                  </div>
                  <ul className="lgn-act-list">
                    {ACTIVITIES.map(item => (
                      <li key={item.time + item.title}>
                        <span className="lgn-act-time">{item.time}</span>
                        <div>
                          <div className="lgn-act-title">
                            <span className={`lgn-dot ${item.kind}`} />
                            {item.title}
                          </div>
                          <div className="lgn-act-detail">{item.detail}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </aside>

          {/* ══ PANEL DERECHO — FORMULARIO ═══════════════════════════ */}
          <section className="lgn-form-panel" aria-label="Formulario de acceso">
            <span className="lgn-secure">
              <span className="material-symbols-outlined" style={{ fontSize: 13 }}>lock</span>
              Acceso cifrado · MFA disponible
            </span>

            <div className="lgn-form-wrap">
              {/* Logo móvil */}
              <div className="lgn-mobile-logo">
                <div style={{
                  width: 38, height: 38, borderRadius: 11,
                  background: 'linear-gradient(145deg,#13c7a6,#05a6bf)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <svg viewBox="0 0 32 32" fill="none" width="18" height="18">
                    <rect x="13" y="4" width="6" height="24" rx="2" fill="white"/>
                    <rect x="4" y="13" width="24" height="6" rx="2" fill="white"/>
                  </svg>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '.95rem', color: '#0b152b' }}>MediWord HSM</strong>
                  <span style={{ fontSize: '.65rem', color: '#66738b', textTransform: 'uppercase', letterSpacing: '.1em' }}>
                    Hospital Serena del Mar
                  </span>
                </div>
              </div>

              <p className="lgn-kicker">Inicio de sesión</p>
              <h2>Ingresa a tu cuenta.</h2>
              <p className="lgn-subhead">
                Usa tus credenciales institucionales para gestionar profesionales,
                habilitaciones y documentos clínicos.
              </p>

              <form onSubmit={handleSubmit}>
                {/* Correo */}
                <div className="lgn-field">
                  <label className="lgn-label" htmlFor="lgn-email">Correo institucional</label>
                  <div className={`lgn-input-shell${focusEmail ? ' focused' : ''}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>mail</span>
                    <input
                      id="lgn-email"
                      type="email"
                      autoComplete="email"
                      placeholder="usuario@chsm.com"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onFocus={() => setFocusEmail(true)}
                      onBlur={() => setFocusEmail(false)}
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="lgn-field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <label className="lgn-label" htmlFor="lgn-pass">Contraseña</label>
                    <button
                      className="lgn-ghost"
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                    >
                      {showPass ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>
                  <div className={`lgn-input-shell${focusPass ? ' focused' : ''}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock</span>
                    <input
                      id="lgn-pass"
                      type={showPass ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Ingresa tu contraseña"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onFocus={() => setFocusPass(true)}
                      onBlur={() => setFocusPass(false)}
                    />
                    <span
                      role="button"
                      tabIndex={-1}
                      onClick={() => setShowPass(v => !v)}
                      style={{ cursor: 'pointer', lineHeight: 1 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#94a3b8' }}>
                        {showPass ? 'visibility_off' : 'visibility'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Botón */}
                <button className="lgn-submit" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, animation: 'lgn-spin 1s linear infinite' }}>
                        progress_activity
                      </span>
                      Ingresando…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span>
                      Entrar al panel
                    </>
                  )}
                </button>
              </form>

              {/* ¿Olvidaste tu contraseña? */}
              <div style={{ marginTop: 18 }}>
                <button
                  type="button"
                  className="lgn-ghost"
                  onClick={() => setShowHelp(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>help_outline</span>
                  ¿Olvidaste tu contraseña?
                </button>

                {showHelp && (
                  <div className="lgn-help-box">
                    <p style={{ fontWeight: 700, color: '#0A2540', fontSize: '.78rem', marginBottom: 4 }}>
                      Contacta al administrador del sistema
                    </p>
                    <p style={{ color: '#475569', fontSize: '.72rem', lineHeight: 1.6 }}>
                      Solicita el restablecimiento de tus credenciales.
                      El administrador a este correo: edgar.guerrero@chsm.com
                      enviará una nueva contraseña a tu correo.
                    </p>
                    <p style={{ color: '#0A2540', fontSize: '.72rem', marginTop: 7, fontWeight: 600 }}>
                      Dirección Médica · Hospital Serena del Mar
                    </p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="lgn-stats" aria-label="Indicadores institucionales">
                {STATS.map(s => (
                  <div key={s.label}>
                    <strong>{s.value}</strong>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </section>
      </main>
    </>
  );
}
