# Estado MediWord V2 — 2026-04-21

## Tickets del Roadmap v2.0

| Ticket | Descripción | Estado |
|--------|-------------|--------|
| TICKET-01 | Migración BD PostgreSQL normalizada (8 tablas) | ✅ Completado |
| TICKET-02 | APIs FastAPI + Pydantic V2 con upsert dinámico | ✅ Completado |
| TICKET-03 | Frontend React Tabs 1-4 vinculados al backend | ✅ Completado |
| TICKET-04 | Lógica de rotación, alertas contractuales, roles admin | ✅ Completado |
| TICKET-05 | Módulo de Reportes / Dashboard exportables PDF/Excel | ✅ Completado |

**El roadmap v2.0 está 100% cerrado.**

---

## Lo que hay en progreso (sin commitear)

Hay 13 archivos modificados + 3 archivos nuevos sin commitear, lo que indica que se inició trabajo post-v2.0:

### Archivos nuevos (untracked)
- `frontend/react-v2/src/pages/medicos/PerfilMedico.jsx` — Perfil Médico Unificado (en desarrollo)
- `frontend/react-v2/src/components/shared/MedicoTable.jsx` — Tabla compartida refactorizada
- `PerfilMedico.jsx` y `propuesta_formulario.html` — borradores / exploración

### Archivos modificados
- Backend: `main.py`, `model.py`, `routers/medicos.py`, `schemas.py`
- Frontend: `Dashboard.jsx`, `ListaFinalizaciones.jsx`, `ListaFSFB.jsx`, `ListaMedicos.jsx`, `Tab2Habilitacion.jsx`, `Tab3Especialidades.jsx`, `ListaInactivos.jsx`, `ListaRenuncias.jsx`, `AppRoutes.jsx`

Cambios orientados a soportar el Perfil Médico Unificado.

---

## ¿Qué sigue?

El próximo paso es el **Perfil Médico Unificado** — una vista que consolide todos los sub-recursos del médico en una sola pantalla de detalle:

- Contacto
- Normativos
- Accesos
- Contratación
- Documentos HV
- Prerrogativas

---

## Stack

- **Backend:** FastAPI (Python 3.12+) — puerto 8001
- **Frontend:** React 19 + Vite + Vanilla CSS — puerto 5173/5174
- **Base de datos:** PostgreSQL (9 tablas normalizadas)
- **Repositorio:** https://github.com/edgarDevG/App-MediWord.git (rama master)