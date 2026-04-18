import io
import pandas as pd
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import get_db
from model import Medico, EspecialidadMetrica
from routers.auth import get_current_user

router = APIRouter(tags=["Reportes"])

@router.get("/exportar")
def exportar_medicos_xlsx(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # We load Medicos
    # Simple flattened report logic
    medicos = db.query(Medico).all()
    
    data = []
    for m in medicos:
        data.append({
            "Documento": m.documento_identidad,
            "Nombre Completo": m.nombre_medico,
            "Categoria": m.categoria,
            "Especialidad": m.especialidad,
            "Estado": m.estado,
            "Tipo Listado": m.tipo_listado,
            "Fecha Ingreso": str(m.fecha_ingreso) if m.fecha_ingreso else "",
        })
        
    df = pd.DataFrame(data)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name="Médicos")
        
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename="reporte_medicos.xlsx"'
    }
    return StreamingResponse(output, headers=headers, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
