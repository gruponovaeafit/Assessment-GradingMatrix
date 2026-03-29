# [REQ] Sistema de Trazabilidad y Logs de Auditoría

### Descripción
Actualmente el sistema no cuenta con trazabilidad de acciones críticas (creación de staff, borrado de assessments). Este requerimiento busca implementar un sistema centralizado de logs de auditoría en la base de datos para registrar quién realizó qué acción, cuándo y desde dónde, permitiendo una supervisión total y forense de seguridad.

### Usuarios afectados
- **Súper Administrador:** Para auditoría global de cambios.
- **Administrador de Grupo:** Para ver quién creó o modificó personal en sus procesos.
- **Equipo de Soporte/Devs:** Para depuración y análisis de seguridad.

### Criterios de aceptación
- [x] Implementar la tabla `AuditLogs` en PostgreSQL con RLS de solo inserción.
- [x] Actualizar el helper `logAudit` para soportar campos `jsonb` y `UserAgent`.
- [x] Integrar logs en el flujo de Login (éxito/fallo).
- [x] Integrar logs en el flujo de creación de Staff (Administrador y Súper Admin).
- [x] Integrar logs en el flujo de eliminación de Assessment.
- [x] Verificar que los logs se guarden correctamente sin interrumpir el flujo de la API ante errores del logger.
- [x] Integrar logs de accesos no autorizados (`requireRoles`).
- [x] Integrar logs de envío de calificaciones.
- [x] Integrar logs de actualización de personal (Staff).

### Alcance técnico
- `src/lib/utils/audit.ts`
- `src/pages/api/auth/login.ts`
- `src/pages/api/staff/create.ts`
- `src/pages/api/super-admin/staff-create.ts`
- `src/pages/api/assessment/delete.ts`
- `src/db/schema.sql`

### Consideraciones / Riesgos
- **Riesgo:** El volumen de logs puede crecer si no se filtran acciones triviales.
- **Privacidad:** No se deben registrar contraseñas ni tokens en el campo `Detalles` (JSONB).
