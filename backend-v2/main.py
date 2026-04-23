"""
MediWork HSM v2.0 — FastAPI main application
Puerto: 8001 | BD: MEDW
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
import model  # noqa: F401 — importar para registrar modelos en Base
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import date
from model import MedicoNormativos, MedicoContratacion, Medico

# ── Tareas programadas (Cron) ─────────────────────────────────
def recalcular_vencimientos_diario():
    print("[CRON] Ejecutando rutinas de vencimiento (Normativos y Contratos)...")
    db = SessionLocal()
    try:
        # 1. Recálculo normativo original
        normativos = db.query(MedicoNormativos).all()
        for doc in normativos:
            cambios = False
            for campo in ["bls", "acls", "pals", "nals", "violencia_sexual", "ataques_quimicos", "dengue", "sedacion", "radioproteccion", "manejo_dolor", "iamii", "gestion_duelo"]:
                fecha = getattr(doc, f"{campo}_fecha_venc", None) or getattr(doc, f"{campo}_fecha", None)
                if fecha:
                    delta = (fecha - date.today()).days
                    if delta > 30:   nuevo_estado = "Vigente"
                    elif delta >= 0: nuevo_estado = "Por vencer"
                    else:            nuevo_estado = "Vencido"
                    
                    if getattr(doc, f"{campo}_estado") != nuevo_estado:
                        setattr(doc, f"{campo}_estado", nuevo_estado)
                        cambios = True
            if cambios:
                db.commit()

        # 2. Rutina silenciosa de Contratación (Pase automático a Finalizados)
        contratos_activos = db.query(MedicoContratacion).join(Medico, MedicoContratacion.medico_id == Medico.id).filter(Medico.estado == "ACTIVO").all()
        for c in contratos_activos:
            if c.fecha_venc_oferta:
                if c.fecha_venc_oferta < date.today():
                    print(f"[CRON] Contrato vencido detectado para el médico ID: {c.medico_id}. Movilizando a FINALIZACIONES.")
                    m = db.query(Medico).filter(Medico.id == c.medico_id).first()
                    if m:
                        m.estado = "FINALIZADO"
                        m.tipo_listado = "finalizacion"
                        db.commit()

    except Exception as e:
        print(f"[CRON] Error: {e}")
        db.rollback()
    finally:
        db.close()
        print("[CRON] Finalizado")

scheduler = AsyncIOScheduler()
scheduler.add_job(recalcular_vencimientos_diario, CronTrigger(hour=0, minute=0))

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: crear tablas si no existen."""
    Base.metadata.create_all(bind=engine)
    print("[OK] [MediWork v2] Tablas creadas/verificadas en MEDW")
    scheduler.start()
    yield
    scheduler.shutdown()
    print("[STOP] [MediWork v2] Shutdown")


app = FastAPI(
    title="MediWork HSM v2.0",
    description="Sistema de Gestión del Cuerpo Médico — Hospital Serena del Mar",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:5174", "http://127.0.0.1:5174",
        "http://localhost:5175", "http://127.0.0.1:5175",
        "http://localhost:5176", "http://127.0.0.1:5176",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health check ──────────────────────────────────────────────
@app.get("/")
def root():
    return {"mensaje": "MediWork HSM v2.0 — Conexión exitosa", "bd": "MEDW"}


# ── Registrar routers ─────────────────────────────────────────
from routers.medicos import router as medicos_router
from routers.maestras import router as maestras_router
from routers.dashboard import router as dashboard_router
from routers.auth import router as auth_router
from routers.reportes import router as reportes_router

app.include_router(auth_router,      prefix="/api/v1/auth")
app.include_router(medicos_router,   prefix="/api/v1")
app.include_router(maestras_router,  prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(reportes_router,  prefix="/api/v1/reportes")
