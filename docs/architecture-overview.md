# Vista General de la Arquitectura

Este documento describe cómo fluye la información en Assessment Grading Matrix y dónde reside cada tipo de lógica. Comprender esta estructura es fundamental para mantener la consistencia del sistema.

---

## Stack Tecnológico

El proyecto es una aplicación Next.js Fullstack que utiliza dos modelos de ruteo y una base de datos gestionada por Supabase.

1. Frontend (App Router): La interfaz de usuario vive en src/app/. Es el estándar moderno de Next.js para layouts y componentes de servidor/cliente.
2. Backend (Pages Router - API): Los endpoints de la API residen en src/pages/api/. Se mantienen aquí por compatibilidad con middlewares y una estructura de contratos más estable.
3. Base de Datos (Supabase/PostgreSQL): No usamos ORM. La lógica de datos reside en esquemas SQL puros y Row Level Security (RLS) en el motor.

---

## Flujo de una Request Autenticada

Cualquier operación que requiera seguridad sigue este camino:

1. UI (Componente): El usuario realiza una acción (ej. calificar).
2. Llamada API (authFetch): Se usa la utilidad src/lib/auth/authFetch.ts. Esta adjunta automáticamente el JWT desde la sesión (o próximamente, las cookies HttpOnly) en el header Authorization: Bearer <token>.
3. Endpoint API: La petición llega a un handler en src/pages/api/.
4. Guardia de Seguridad (requireRoles): El handler llama a requireRoles(req, res, ['admin', 'calificador']). Esta función verifica el token y el rol del usuario.
5. Supabase Client: El servidor usa el cliente de Supabase (con permisos de servicio si es necesario) para operar sobre la DB.
6. Respuesta: Se devuelve un JSON estandarizado (ver docs/api-spec.md).

---

## Organización de la Lógica

| Directorio | Responsabilidad |
| --- | --- |
| src/app/ | Rutas de la UI, layouts y componentes de página (Thin Pages). |
| src/features/ | Módulos de dominio que agrupan hooks, componentes, esquemas y utilidades por funcionalidad. |
| src/pages/api/ | Handlers de la API. Se agrupan por dominio (auth, assessment, staff). |
| src/components/UI/ | Componentes visuales atómicos y puros (Button, Toast, Modal). |
| src/hooks/ | Hooks globales/compartidos (ej. useAdminAuth, useGraderAuth). |
| src/lib/auth/ | Utilidades de JWT, hashing de contraseñas y lógica de sesión. |
| src/lib/supabase/ | Clientes para interactuar con la DB (browser y server-side). |
| src/db/ | Fuente de verdad del esquema (schema.sql) y políticas de seguridad (rls-policies.sql). |
| scripts/ | Herramientas fuera del runtime para inspección o dump de datos. |

---

## Patrones de Arquitectura Avanzados

### 1. Composición por Features (ADR 0003)
Para evitar componentes monolíticos, las vistas complejas se descomponen en:
- **Container**: Orquestador en `src/features/[feature]/ConfigContainer.tsx`.
- **Domain Hooks**: Lógica de estado y fetching en `hooks/`.
- **Feature Components**: UI específica en `components/`.
- **Schemas**: Definiciones de tipos y validación en `schemas/`.

### 2. Validación en Runtime (Zod)
No confiamos ciegamente en las respuestas de la API. Usamos `zod` en la frontera de los hooks de datos para validar que el payload coincide con lo esperado. Esto previene errores en cascada en la UI y facilita el debugging.

### 3. Testing (Vitest)
El proyecto utiliza **Vitest** y **React Testing Library** para pruebas unitarias.
- Las pruebas de hooks deben mockear `authFetch` para verificar el flujo de datos y validaciones.
- Los archivos de prueba viven junto al código que prueban (ej. `useAssessments.test.ts`).

---

## Patrones de Código Comunes

- Method Guards: Siempre verifica el método HTTP al inicio del handler:
    ```typescript
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
    ```
- Error Handling: Usa siempre el formato { error: "Mensaje" } para respuestas negativas.
- Toast Notifications: Las notificaciones se disparan desde el cliente usando showToast.success() o showToast.error().

---

## Qué NO hacer

1. No usar Supabase Service Key en el Frontend: Esta llave tiene privilegios totales. Solo debe usarse en scripts o API routes (server-side).
2. No crear Páginas Monolíticas: Si tu archivo en src/app/ supera las 300 líneas, es hora de aplicar el ADR 0003 (Decomposición de Vistas).
3. No saltarse authFetch: No uses fetch plano para llamadas internas, ya que perderás la gestión de tokens y expiración de sesión.
