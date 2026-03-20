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

### 1. Composición por Features / Feature Sliced Design (FSD) (ADR 0003)
Para evitar componentes monolíticos y mantener baja la dependencia cruzada aplicando conceptos de Feature Sliced Design (FSD), las vistas complejas se descomponen en:
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

## Reglas de Arquitectura Críticas (MANDATORIAS)

Para evitar regresiones en seguridad y deudas técnicas, todo desarrollador debe seguir estas reglas:

1. **`proxy.ts` es EL Middleware**: En Next.js 16, el archivo `src/proxy.ts` es el único punto de entrada para la intercepción de rutas en Edge Runtime. **NO crear `src/middleware.ts`** — tener ambos causa un error fatal de compilación. No borrar ni desactivar `src/proxy.ts`; es la columna vertebral de la autenticación.
2. **`assessmentId` debe ser siempre explícito**: Todos los endpoints bajo `src/pages/api/dashboard/**` y los hooks de datos de admin (`useConfigData`, `useGestionData`, etc.) **DEBEN** requerir `assessmentId` como un parámetro explícito — nunca inferir un valor por defecto. Usar `resolveAssessmentId(req.query.assessmentId)` y retornar 400 si falta.
3. **Los hooks de Auth no replican la protección de rutas**: Los hooks de frontend (`useAdminAuth`, `useGraderAuth`, etc.) son solo para estado de UI (ej. mostrar el botón de logout, leer el rol actual). La protección de rutas es responsabilidad exclusiva de `src/proxy.ts`. No añadir guardas basadas en `localStorage`.
4. **Coordinación de PRs en archivos compartidos**: Antes de abrir una PR que toque `src/features/admin/**`, `src/pages/api/dashboard/**` o `src/proxy.ts`, verificar si hay otras PRs abiertas modificando los mismos archivos para evitar conflictos de refactorización paralela.
