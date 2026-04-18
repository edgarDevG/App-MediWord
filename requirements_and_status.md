# MediWord v2.0 - Requisitos y Estado del Proyecto

## 1. Estado Actual (Tickets / Avance)

Actualmente nos encontramos en la **Fase de Integración y Mapeo** habiendo estabilizado la Base de Datos V2. El progreso es el siguiente:

*   ✅ **TICKET-01: Migración a PostgreSQL normalizado:** Se crearon las 8 tablas relacionales (`medicos`, `medicos_datos_hv`, `medicos_diplomas`, `medicos_contratacion`, etc.) y las tablas maestras parametrizables.
*   ✅ **TICKET-02: APIs y Pydantic V2:** Se configuraron los endpoints de sub-recursos con la función `upsert()` que permite "parchar" dinámicamente secciones del médico sin bloquearse por campos vacíos.
*   ✅ **TICKET-03: Refactorización de UX (Tabs 1 a 4):** Se vinculó exitosamente el Frontend en React (Tabs de Habilitación, Especialidades e Institucional) para que envíen cargas JSON masivas seguras que cumplan con la rigurosidad de validación del nuevo Backend.
*   En Proceso ⏳ **TICKET-04: Lógica de Negocio y Clasificaciones (El objetivo actual):** Implementación de reglas estrictas para el traslado de médicos entre listados (Activos, Renuncias, Finalizados, Inactivos) y alertas automáticas de vencimiento contractual.
*   Pendiente ⭕ **TICKET-05: Módulo de Reportes / Dashboard y Exportables:** Estadísticas reales en PDF y EXCEL, lectura dinámica de las alertas de "Por vencer".

---

## 2. Requisitos Funcionales Implementados y Por Implementar

**2.1. Gestión de Médicos (Implementado)**
*   **RF-01:** El sistema debe permitir registrar, editar y consultar el *Cuerpo Médico* a través de un wizard de +4 apartados (Tabs) sin pérdida de estado.
*   **RF-02:** El sistema debe validar que los documentos obligatorios estén presentes (ej. RETHUS) y aceptar fechas de caducidad para emitir alertas.

**2.2. Rotación y Estados (En Planificación)**
*   **RF-03:** Un Administrador deberá poder marcar a un médico activo bajo 3 categorías de egreso a través de un botón de acción en el Dashboard:
    *   *Renuncia:* Traslada al médico a la vista de renuncias.
    *   *Finalización de Contrato:* Traslada al médico a la vista de finalizaciones.
    *   *Personal Inactivo:* Suspende el acceso/conteo del médico pero conserva su histórico.
*   **RF-04:** El sistema debe poseer un demonio (cronjob) o cálculo en tiempo real que inspeccione la fecha de `fecha_venc_oferta` (o equivalente a su condición contractual). 
*   **RF-05:** Si el contrato está próximo a vencerse (ej. 30 días o menos), debe sumarse a la métrica de "Alertas Venc.".
*   **RF-06:** Si la fecha del contrato expira (fecha actual > fecha vencimiento), el sistema automatizará su clasificación a `Finalización de Contrato` o `Inactivo` inmediatamente, sacándolo del tablero principal de "Activos".

**2.3. Autenticación y Autorización**
*   **RF-07:** El sistema debe restringir ciertas acciones (como trasladar al médico a "Renuncia") estrictamente a usuarios con rol `admin`. 

---

## 3. Requisitos No Funcionales

*   **RNF-01 [Rendimiento]:** Las consultas al listado maestro de médicos deben resolverse mediante paginación en el backend para evitar sobrecargas de memoria en consultas mayores a 5,000 registros.
*   **RNF-02 [Integridad de Datos]:** La base de datos debe impedir la eliminación (Hard Delete) de registros médicos; toda baja debe ser lógica (Soft Delete) cambiando su estado/listado.
*   **RNF-03 [Tolerancia a Nulos]:** Si se desconoce una fecha de vencimiento, el sistema no debería bloquear el flujo sino clasificar al documento como "Pendiente" o "N/A" automáticamente.
*   **RNF-04 [Paridad UI-DB]:** Todo campo existente en la UI debe tener una columna espejo en la base de datos para no sufrir fuga de información en el Upsert.
