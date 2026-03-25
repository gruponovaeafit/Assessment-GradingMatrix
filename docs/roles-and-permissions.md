# Roles y Permisos

Este documento detalla la matriz de acceso del sistema para asegurar que los desarrolladores apliquen los guards de seguridad correctos tanto en la UI como en la API.

---

## Definición de Roles

1. Superadmin: 
    - Identificador: `id: 0` (asignado exclusivamente en login si el correo coincide con `ADMIN_EMAIL`).
    - Alcance: Global (todos los grupos).
    - Misión: Crear grupos, crear assessments y gestionar el staff administrativo inicial. Es el único con permiso para eliminar assessments.
    - **Modo Solo Lectura**: Si el assessment actual tiene `Activo_Assessment = false`, el superadmin puede entrar pero no realizar cambios (POST/PUT/DELETE), excepto para reactivar el assessment.
2. Admin de Grupo: 
    - Alcance: Un solo GrupoEstudiantil/Assessment asignado en su JWT.
    - Misión: Configurar bases, registrar staff, gestionar participantes y ver dashboards de resultados de su grupo. No puede crear ni eliminar assessments.
    - **Bloqueo por Estado**: Si el assessment tiene `Activo_Assessment = false`, el acceso es denegado (403).
3. Registrador: 
    - Alcance: Assessment asignado.
    - Misión: Inscripción rápida de participantes (Mobile).
    - **Bloqueo por Estado**: Denegado (403) si el assessment está inactivo.
4. Calificador (Grader): 
    - Alcance: Base asignada dentro de un Assessment.
    - Misión: Evaluar a los participantes de su grupo asignado (Mobile).
    - **Bloqueo por Estado**: Denegado (403) si el assessment está inactivo.

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
| GET /api/assessment/list | admin | |
| POST /api/assessment/create | **Superadmin (id:0)** | Restringido por ID en servidor |
| DELETE /api/assessment/delete | **Superadmin (id:0)** | Requiere `ADMIN_DELETE_PASSWORD` |
| PUT /api/assessment/update | admin | Superadmin bypasses JWT restriction |
| POST /api/assessment/toggle-active | admin | Superadmin bypasses JWT restriction |
| GET /api/base/* | admin | |
| POST /api/base/* | admin | |
| GET /api/staff/* | admin | |
| POST /api/staff/* | admin | |
| POST /api/super-admin/staff-create | **Superadmin (id:0)** | Nueva para evitar logout bug |
| POST /api/register | admin, registrador | |
| PUT /api/update-person | admin, registrador | |
| GET /api/grader/* | admin, calificador |
| POST /api/add-calificaciones | admin, calificador |

---

## Mecanismos de Seguridad

1. **Middleware (`src/proxy.ts`):** Intercepta todas las peticiones a rutas protegidas (`/admin/*`, `/grader`, `/register`, Panel Superadmin) y valida la cookie `session` (JWT) usando `jose` en Edge Runtime. Si no es válida o el rol no tiene acceso, redirige a `/auth/login`.
2. Server-Side Validation: Obligatoria. Los handlers de API deben verificar el JWT vía `requireRoles()`. No confíes solo en middleware para APIs.
3. Supabase RLS: Las tablas tienen políticas de PostgreSQL que restringen qué filas puede ver un ID_Staff según su rol. Consulta src/db/rls-policies.sql.

---

### Notas Importantes
- Un Admin de Grupo no puede ver ni operar assessments de otros grupos estudiantiles (ADR 0002).
- El acceso Superadmin está actualmente basado en variables de entorno (ADMIN_EMAIL). La migración a permisos persistidos está en el backlog (Issue #70).
