"""
Router: /api/v1/audit
Permite consultar los logs de auditoría (Ley 1581) a administradores.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from model import AuditLog, User, Medico
from routers.auth import require_roles
from schemas import AuditLogOut
from datetime import date

_ADMINS = require_roles("admin")

router = APIRouter(tags=["Auditoría"], dependencies=[Depends(_ADMINS)])

@router.get("/audit/logs", response_model=list[AuditLogOut])
def get_audit_logs(
    start_date: date = Query(None),
    end_date: date = Query(None),
    event_category: str = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = (
        db.query(AuditLog, User.username, User.nombre.label("usuario_full"), Medico.nombre_medico)
        .outerjoin(User, AuditLog.user_id == User.id)
        .outerjoin(Medico, AuditLog.medico_id == Medico.id)
    )
    
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    if event_category:
        query = query.filter(AuditLog.event_category == event_category)
        
    query = query.order_by(desc(AuditLog.created_at))
    
    resultados = query.offset(offset).limit(limit).all()
    
    out = []
    for log, uname, ufull, mnom in resultados:
        usuario_str = ufull or uname or "sistema"
        medico_str = mnom or "N/A"
        if medico_str == "N/A" and log.medico_id:
            medico_str = f"ID: {log.medico_id}"
            
        dto = AuditLogOut.model_validate(log)
        dto.usuario_nombre = usuario_str
        dto.medico_nombre = medico_str
        out.append(dto)
        
    return out
