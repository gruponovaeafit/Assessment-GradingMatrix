# Plan de Documentación de Onboarding

Este documento captura las propuestas de documentación para onboarding de nuevos desarrolladores, incluyendo el contenido sugerido y el orden de implementación. Está diseñado como handoff para que cualquier sesión de trabajo pueda ejecutar estas ideas directamente.

---

## Estado Actual de `docs/`

| Documento | Estado |
| --- | --- |
| `docs/api-spec.md` | Completo. Cubre todos los endpoints de `src/pages/api` con clasificación productivo/interno/legacy. |
| `docs/decisions/` | 6 ADRs (auth cookies, group scoping, view decomposition, explicit assessmentId, is_impostor, formal API spec). |
| `docs/onboarding.md` | Existe pero es genérico. Debe reescribirse con contenido más accionable. |
| `README.md` (raíz) | Cubre instalación y estructura básica. Necesita enlazar a los nuevos docs y actualizarse. |

---

## Documentos Propuestos

### 1. `docs/onboarding.md` (reescritura)

**Por qué:** El actual es vago y mezcla conceptos sin profundizar. Un developer nuevo necesita una guía paso a paso que lo lleve desde clonar el repo hasta hacer su primer PR útil.

**Contenido sugerido:**
- Checklist del primer día: clonar, instalar, configurar `.env.local`, levantar dev server, verificar login local.
- Cómo obtener credenciales de Supabase para desarrollo local.
- Cómo funciona el auth localmente y cómo obtener un usuario admin/test válido.
- Problemas comunes de startup y sus soluciones (ej. "Why am I getting 401 locally?", "Why does the build fail with missing env vars?").
- Links a los otros docs de onboarding como siguiente lectura.
- "Tu primera tarea": cómo encontrar un issue asignable y entender su contexto.

### 2. `docs/architecture-overview.md` (nuevo)

**Por qué:** Ningún doc actual explica cómo fluye una request desde la UI hasta la DB. Esto es lo primero que un developer necesita para no romper cosas.

**Contenido sugerido:**
- Diagrama o narrativa del stack: Next.js App Router (UI) + Pages Router (API) + Supabase/Postgres.
- Cómo fluye una request autenticada: UI -> `authFetch` -> API route -> `requireRoles` -> Supabase query -> response.
- Dónde vive cada tipo de lógica:
  - Páginas/layouts: `src/app/`
  - API handlers: `src/pages/api/`
  - Auth utilities: `src/lib/auth/`
  - DB clients: `src/lib/supabase/`
  - Hooks de dominio: `src/hooks/`
  - Componentes reutilizables: `src/components/UI/`
  - Schema/RLS: `src/db/`
- Patrones de código que se repiten: method guards, `requireRoles`, Supabase query-builder, Toast notifications.
- Qué NO hacer: no usar Supabase service key en frontend, no crear páginas monolíticas, no saltarse `authFetch`.
- Referencia cruzada a ADRs relevantes para decisiones arquitectónicas.

### 3. `docs/domain-glossary.md` (nuevo)

**Por qué:** Este proyecto usa vocabulario de dominio en español que no es obvio para un developer nuevo. Sin un glosario, la gente adivina qué significa cada tabla/campo y comete errores de modelado.

**Contenido sugerido:**

| Término | Definición | Tabla/campo en DB |
| --- | --- | --- |
| **Assessment** | Proceso evaluativo completo. Contiene bases, participantes y grupos. | `Assessment` |
| **GrupoEstudiantil** | Organización o programa académico que agrupa assessments. | `GrupoEstudiantil` |
| **GrupoAssessment** | Subgrupo de participantes dentro de un assessment, creado para la evaluación. | `GrupoAssessment` |
| **Base** | Estación o competencia evaluada. Cada base tiene 3 comportamientos calificables. | `Base` |
| **Staff** | Usuario operativo: admin, registrador o calificador. | `Staff` |
| **Participante / Persona** | Individuo siendo evaluado en un assessment. | `Persona` |
| **Impostor** | Participante marcado como "infiltrado" para control de calidad de la evaluación. | `Persona.Is_Impostor` (en transición desde `Rol_Participante`) |
| **Calificador / Grader** | Miembro del staff que evalúa participantes en una base asignada. | `Staff` con `Rol_Staff = 'calificador'` |
| **Registrador** | Miembro del staff que inscribe participantes (mobile-first). | `Staff` con `Rol_Staff = 'registrador'` |
| **Superadmin** | Acceso global para crear grupos estudiantiles, assessments y admins. Ruta: `/k7v9x2q0m5p8n1t6z3r4w9y1`. | Credenciales en `.env.local` |
| **Admin de Grupo** | Administrador con alcance limitado a un GrupoEstudiantil. | `Staff` con `Rol_Staff = 'admin'` + `ID_GrupoEstudiantil` (en transición) |
| **Rotación** | Asignación de un calificador a un grupo de evaluación. Módulo en proceso de eliminación (#68). | `Staff.ID_GrupoAssessment` |
| **Calificación** | Puntuación emitida por un calificador sobre un participante en una base (3 valores por comportamiento). | `Calificacion` |

- Incluir notas sobre términos en transición (ej. `Rol_Participante` -> `Is_Impostor`, admin scope por grupo).
- Mantener sincronizado con `src/db/schema.sql`.

### 4. `docs/roles-and-permissions.md` (nuevo)

**Por qué:** El sistema tiene 4 roles con permisos muy distintos. Sin una matriz clara, un developer puede abrir endpoints a roles incorrectos o romper auth guards.

**Contenido sugerido:**

**Matriz de acceso por pantalla:**

| Pantalla | Superadmin | Admin | Registrador | Calificador |
| --- | --- | --- | --- | --- |
| `/k7v9x2q0m5p8n1t6z3r4w9y1` (panel superadmin) | Si | No | No | No |
| `/admin/*` (hub admin) | Si | Si | No | No |
| `/admin/configuracion` | Si | Si | No | No |
| `/admin/gestion` | Si | Si | No | No |
| `/admin/bases` | Si | Si | No | No |
| `/register` | No | Si | Si | No |
| `/grader` | No | Si | No | Si |

**Matriz de acceso por endpoint (resumen):**

| Endpoint | Roles permitidos |
| --- | --- |
| `POST /api/auth/login` | Público |
| `POST /api/auth/logout` | Cualquier autenticado |
| `GET /api/assessment/*` | `admin` |
| `POST /api/assessment/*` | `admin` |
| `GET /api/base/*` | `admin` |
| `POST /api/base/*` | `admin` |
| `GET /api/staff/*` | `admin` |
| `POST /api/staff/*` | `admin` |
| `POST /api/register` | `admin`, `registrador` |
| `PUT /api/update-person` | `admin`, `registrador` |
| `POST /api/grader/*` | `admin`, `calificador` |
| `POST /api/add-calificaciones` | `admin`, `calificador` |
| `POST /api/check-already-graded` | `admin`, `calificador` |

- Documentar el mecanismo de auth: JWT en `Authorization: Bearer`, validado por `requireRoles(req, res, [...])`.
- Notas sobre la transición de superadmin (actualmente hardcodeado, futuro: permisos persistidos, ver #70).
- Notas sobre el alcance admin por GrupoEstudiantil (en transición, ver épica #73).
- Referencia cruzada a `docs/api-spec.md` para contratos detallados.

### 5. `docs/contributing.md` (nuevo)

**Por qué:** El `README.md` actual tiene 4 líneas de contribución. Un developer nuevo necesita saber qué se espera antes de abrir un PR.

**Contenido sugerido:**
- Branch naming: `feat/...`, `fix/...`, `refactor/...`, `docs/...`
- Commit messages: conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`).
- Definition of done:
  - `npm run lint` pasa.
  - `npm run build` compila.
  - Documentación afectada está actualizada (`api-spec.md`, `AGENTS.md`, ADRs si aplica).
  - Issue tiene criterios de aceptación cumplidos.
- Cómo actualizar docs cuando cambias APIs, schema o auth.
- Cómo verificar manualmente:
  - Backend: probar endpoint con `curl` o desde la UI, verificar respuestas y errores.
  - Frontend: probar en desktop y mobile, verificar estados de carga/error/vacío.
  - Auth: verificar que usuarios no autorizados reciben 401/403.
- Qué NO hacer en un PR:
  - No formatear archivos que no tocaste.
  - No commitear `.env.local` o secrets.
  - No introducir dependencias sin verificar que no existen ya en el proyecto.
  - No crear páginas monolíticas (ver ADR 0003).

### 6. `docs/troubleshooting.md` (nuevo, prioridad baja)

**Por qué:** Reduce preguntas repetitivas y tiempo perdido en problemas comunes.

**Contenido sugerido:**
- "¿Por qué recibo 401 localmente?" -> Verificar token, verificar `.env.local`, verificar rol.
- "¿Por qué el build falla con variables faltantes?" -> Copiar `.env.example` a `.env.local`.
- "¿Por qué algunos endpoints usan un `assessmentId` por defecto?" -> Legacy; ver #58 y `docs/api-spec.md` notas de normalización.
- "¿Por qué hay endpoints con nombres en inglés y otros en español?" -> Legacy; el estándar actual es español para UI/API messages.
- "¿Cómo reseteo datos locales?" -> Documentar si hay scripts de seed/reset en `scripts/`.
- "¿Qué es el módulo de rotaciones?" -> En proceso de eliminación (#68).

---

## Orden de Implementación

### Fase 1 (crítica para onboarding)
1. `docs/architecture-overview.md`
2. `docs/domain-glossary.md`
3. `docs/roles-and-permissions.md`

### Fase 2 (mejora la calidad del workflow)
4. `docs/onboarding.md` (reescritura)
5. `docs/contributing.md`

### Fase 3 (reduce fricción operativa)
6. `docs/troubleshooting.md`

### Fase transversal
- Actualizar `README.md` para enlazar a todos los docs nuevos bajo una sección `## Documentación`.
- Actualizar `docs/onboarding.md` para que funcione como hub con links a los demás documentos.

---

## Fuentes de Verdad para Escribir los Docs

| Doc propuesto | Fuentes principales |
| --- | --- |
| Architecture | `README.md`, `AGENTS.md`, `src/app/layout.tsx`, `src/lib/auth/`, `src/pages/api/` |
| Glossary | `src/db/schema.sql`, `docs/api-spec.md`, ADRs 0002/0004/0005 |
| Roles/Permissions | `src/lib/auth/apiAuth.ts`, `docs/api-spec.md`, `src/hooks/useAdminAuth.ts` |
| Onboarding rewrite | Current `docs/onboarding.md`, `.env.example`, `README.md` |
| Contributing | `AGENTS.md`, `README.md`, `package.json` |
| Troubleshooting | Common issues from codebase patterns, `docs/api-spec.md` normalization notes |

---

_Este documento es un plan de trabajo, no documentación final. Cada sección debe convertirse en su propio archivo `.md` bajo `docs/`._
