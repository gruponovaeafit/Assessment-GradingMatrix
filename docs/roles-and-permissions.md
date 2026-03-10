# Roles y Permisos

Este documento detalla la matriz de acceso del sistema para asegurar que los desarrolladores apliquen los guards de seguridad correctos tanto en la UI como en la API.

---

## Definición de Roles

1. Superadmin: 
    - Alcance: Global (todos los grupos).
    - Misión: Crear grupos, crear assessments iniciales y gestionar los primeros administradores de grupo.
2. Admin de Grupo: 
    - Alcance: Un solo GrupoEstudiantil.
    - Misión: Configurar bases, registrar staff, gestionar participantes y ver dashboards de resultados de su grupo.
3. Registrador: 
    - Alcance: Assessment asignado.
    - Misión: Inscripción rápida de participantes (Mobile).
4. Calificador (Grader): 
    - Alcance: Base asignada dentro de un Assessment.
    - Misión: Evaluar a los participantes de su grupo asignado (Mobile).

---

## Matriz de Acceso por Pantalla (UI)

| Ruta | Superadmin | Admin | Registrador | Calificador |
| --- | --- | --- | --- | --- |
| /k7v9... (Panel Superadmin) | OK | NO | NO | NO |
| /admin/* (Hub Admin) | OK | OK | NO | NO |
| /admin/configuracion | OK | OK | NO | NO |
| /admin/gestion | OK | OK | NO | NO |
| /admin/bases | OK | OK | NO | NO |
| /register | NO | OK | OK | NO |
| /grader | NO | OK | NO | OK |

---

## Matriz de Acceso por API (Endpoints)

El sistema usa requireRoles(req, res, [roles]) para proteger los handlers.

| Endpoint | Roles Permitidos |
| --- | --- |
| POST /api/auth/login | Público |
| GET /api/assessment/list | admin |
| POST /api/assessment/create | admin |
| GET /api/base/* | admin |
| POST /api/base/* | admin |
| GET /api/staff/* | admin |
| POST /api/staff/* | admin |
| POST /api/register | admin, registrador |
| PUT /api/update-person | admin, registrador |
| GET /api/grader/* | admin, calificador |
| POST /api/add-calificaciones | admin, calificador |

---

## Mecanismos de Seguridad

1. Client-Side Guards: Componentes como useAdminAuth verifican el rol en el cliente para redirecciones rápidas.
2. Server-Side Validation: Obligatoria. El middleware y los handlers de API deben verificar el JWT. No confíes solo en la ocultación de elementos en el frontend.
3. Supabase RLS: Las tablas tienen políticas de PostgreSQL que restringen qué filas puede ver un ID_Staff según su rol. Consulta src/db/rls-policies.sql.

---

### Notas Importantes
- Un Admin de Grupo no puede ver ni operar assessments de otros grupos estudiantiles (ADR 0002).
- El acceso Superadmin está actualmente basado en variables de entorno (ADMIN_EMAIL). La migración a permisos persistidos está en el backlog (Issue #70).
