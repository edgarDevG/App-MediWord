# Contexto Histórico y Técnico: Proyecto MediWord

Este documento resume el estado actual, hitos alcanzados y arquitectura del sistema MediWord para facilitar la continuidad del desarrollo.

## 1. Objetivo del Proyecto
Migrar la gestión de la "Matriz de Dirección Médica" (originalmente en Excel) a una aplicación web robusta (MediWord V2) que permita el seguimiento completo del ciclo de vida del personal médico, desde el ingreso hasta la desvinculación o jubilación.

## 2. Stack Tecnológico
- **Backend:** FastAPI (Python 3.12+) utilizando SQLAlchemy y Pydantic.
- **Frontend:** React 19 con Vite, utilizando Vanilla CSS para un diseño premium y adaptativo.
- **Base de Datos:** PostgreSQL (Normalizada en 9 tablas clave: médicos, contacto, normativos, accesos, contratación, etc.).
- **Servicio:** Ejecutándose en local (Backend puerto 8001, Frontend puerto 5173/5174).

## 3. Estado Actual y Funcionalidades Implementadas
- **Dashboard Principal:** Tabla de médicos con filtros por estado (Activos, Renuncias, Finalizaciones, Inactivos).
- **Gestión de Ciclo de Vida:**
    - Botón de opciones (`ActionMenu`) en el Dashboard para transiciones de estado asistidas (Renuncia, Finalización, Inactividad).
    - **Rutina Silenciosa (Cronjob):** Proceso automático basado en `APScheduler` que verifica diariamente vencimientos de documentos y contratos, moviendo automáticamente a médicos al estado `FINALIZADO` si su contrato expira.
- **Panel de Notificaciones:** Sistema de alertas en la barra superior que detecta documentos próximos a vencer (30 días) y permite hacer clic para navegar directamente al formulario de edición del médico.
- **Wizard de Registro (Legacy/Current):** Formulario de 5 pestañas que sincroniza datos persistentes hacia múltiples sub-recursos en el backend.

## 4. Arquitectura de Datos (Backend V2)
El sistema utiliza una arquitectura de "sub-recursos" por médico. Cada médico tiene un `documento_identidad` único y tablas relacionadas vinculadas por `medico_id`:
- `Medico` (Base)
- `MedicoContacto`
- `MedicoNormativos` (BLS, ACLS, RETHUS, etc.)
- `MedicoAccesos` (Pólizas, carnets, códigos)
- `MedicoContratacion` (Fechas de firma, vencimiento de oferta mercantil)
- `MedicoDocumentosHV`, `MedicoPrerrogativas`, etc.

## 5. Próximo Paso Crítico (Handover)
**Nueva Propuesta de Interfaz: Perfil Médico Unificado**
El usuario ha proporcionado un borrador llamado `PerfilMedico.jsx` en la raíz del proyecto. El objetivo es:
1. **Reemplazar el Wizard de pestañas** por una vista de página única (tipo Dashboard de Ajustes).
2. **Implementar Barra de Progreso Global:** Visualizar qué porcentaje de la carpeta médica está diligenciado.
3. **Modularidad:** Dividir el formulario en tarjetas de sección (Cards) con scrollspy/anclas laterales.
4. **Respetar Estética Premium:** Traducir los borradores de Tailwind a la identidad visual de Azure/Premium de MediWord.

## 6. Documentos de Referencia
- `prompt_master.txt`: Contiene las reglas de negocio y roles.
- `requirements_and_status.md`: Listado detallado de requerimientos funcionales y no funcionales.
- `task.md`: Seguimiento de los últimos tickets cerrados.
- `PerfilMedico.jsx`: Documento base para la nueva fase de UI.
