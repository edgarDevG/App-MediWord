from sqlalchemy.orm import Session
from model import AuditLog
from fastapi import Request
import json
from datetime import datetime

def get_client_info(request: Request):
    ip_address = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent") if request else None
    return ip_address, user_agent

def calcular_delta(old_obj, new_data: dict) -> dict:
    """Calcula la diferencia (delta) entre un objeto SQLAlchemy viejo y un dict nuevo."""
    if not old_obj:
        return {"after": new_data}
    
    delta = {}
    for key, new_val in new_data.items():
        if hasattr(old_obj, key):
            old_val = getattr(old_obj, key)
            # Para fechas y datetime convertimos a string para comparar y serializar
            if hasattr(old_val, "isoformat"):
                old_val = old_val.isoformat()
            if hasattr(new_val, "isoformat"):
                new_val = new_val.isoformat()
                
            if old_val != new_val:
                delta[key] = {"before": old_val, "after": new_val}
        else:
            delta[key] = {"before": None, "after": new_val}
    return delta

def registrar_auditoria(db: Session, user_id: int, action: str, table_name: str, 
                        medico_id: int = None, details: dict = None, 
                        event_category: str = "CRUD", severity: str = "INFO",
                        request: Request = None, ip_address: str = None):
    """
    Registra una acción en la tabla audit_log (Ley 1581).
    details asume que ya viene en formato de deltas si es un UPDATE.
    """
    try:
        user_agent = None
        if request:
            req_ip, req_ua = get_client_info(request)
            if not ip_address:
                ip_address = req_ip
            user_agent = req_ua
            
        print(f"[DEBUG AUDIT] Guardando en DB, details: {details}")

        log = AuditLog(
            user_id=user_id,
            medico_id=medico_id,
            action=action,
            event_category=event_category,
            severity=severity,
            table_name=table_name,
            ip_address=ip_address,
            user_agent=user_agent,
            changes=details if details else {}
        )
        db.add(log)
        db.commit()
        print(f"[DEBUG AUDIT] Guardado exitoso! ID: {log.id}")
    except Exception as e:
        print(f"[AUDITORIA ERROR] Fallo al registrar log: {e}")
        db.rollback()
