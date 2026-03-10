# 🚀 Onboarding para Desarrolladores - Assessment Grading Matrix

Bienvenido al equipo de desarrollo de **Assessment Grading Matrix**. Este documento es tu guía rápida para entender la arquitectura, las reglas de juego y cómo contribuir de manera efectiva al proyecto.

---

## 🧠 1. El Modelo Mental del Proyecto

El sistema está diseñado para gestionar procesos evaluativos ("Assessments") divididos por grupos organizacionales. Existen tres perfiles de usuario claramente diferenciados en el código:

1.  **Superadmin (`/k7v9x2q0m5p8n1t6z3r4w9y1`):** Acceso global para crear Grupos Estudiantiles, Assessments y asignar los primeros Administradores. Es un acceso de "infraestructura".
2.  **Admin de Grupo (`/admin`):** Pertenece a un `GrupoEstudiantil`. Gestiona la configuración de sus propios assessments, crea bases de evaluación y registra a su personal (Staff).
3.  **Staff (Grader/Registrar):** Los usuarios operativos. 
    - **Registradores (`/register`):** Mobile-first, inscriben participantes.
    - **Calificadores (`/grader`):** Mobile-first, evalúan a los participantes en las bases asignadas.

---

## 🛠️ 2. Stack Tecnológico y "Reglas de Oro"

### Frontend (Next.js + React)
- **Estilizado:** Priorizamos **Vanilla CSS** (en `globals.css` o módulos) para mantener un control total sobre la estética del producto. **Evita introducir Tailwind CSS** a menos que sea una instrucción explícita del liderazgo.
- **Arquitectura de Vistas:** Seguimos el **ADR 0003**. No crees páginas monolíticas; descompón la lógica en hooks de dominio (`src/hooks`) y componentes pequeños en carpetas de `features`.

### Backend (Next.js API Routes + Supabase)
- **Base de Datos:** No usamos ORM (Prisma/Drizzle). La fuente de verdad es **`src/db/schema.sql`**. Cualquier cambio en el esquema debe reflejarse allí primero.
- **Políticas RLS:** La seguridad se delega a PostgreSQL mediante Row Level Security (**`src/db/rls-policies.sql`**). Consúltalo antes de crear nuevos endpoints.
- **Contratos de API:** Antes de modificar un endpoint, consulta **`docs/api-spec.md`**. Debes mantener los contratos estables y documentados.

---

## 🔐 3. Autenticación y Seguridad

- **Peticiones Autenticadas:** Nunca uses `fetch` directamente para APIs protegidas. Usa siempre la utilidad **`src/lib/auth/authFetch.ts`**, que gestiona automáticamente los headers y las sesiones.
- **LocalStorage vs Cookies:** Estamos en transición hacia **Cookies HttpOnly (ADR 0001)**. Revisa el estado de la migración antes de implementar lógica de sesión persistente.
- **Variables de Entorno:** Copia `.env.example` a `.env.local`. Necesitarás la `SUPABASE_SERVICE_ROLE_KEY` para ejecutar scripts administrativos localmente.

---

## 📂 4. Mapa del Tesoro (Archivos Clave)

- `docs/decisions/`: **Lee esto primero.** Contiene los Architectural Decision Records (ADRs) que explican el "por qué" de las decisiones técnicas.
- `src/lib/supabase/`: Configuración del cliente de Supabase (browser y server-side).
- `src/hooks/useAdminAuth.ts`: El punto central para validar el acceso de administradores en el frontend.
- `scripts/`: Herramientas de utilidad para inspeccionar la base de datos o generar reportes de esquema.

---

## 🔄 5. Flujo de Trabajo

1.  **Requerimientos:** Todas las tareas deben nacer de un Issue que use el template de `Requirement`. No empieces a programar sin criterios de aceptación claros.
2.  **Dependencias:** Revisa la sección de `🔗 Dependencias` en los issues. El proyecto tiene una secuencia lógica de ejecución para evitar conflictos de merge.
3.  **Validación:** Antes de pushear, asegúrate de que:
    - `npm run lint` no arroja errores.
    - `npm run build` compila correctamente.
    - Has actualizado las pruebas o la documentación afectada.

---

¿Listo para empezar? Revisa el **Issue #59** (Épica de Refactorización) o el **Issue #73** (Alineación de Permisos) para encontrar tu primera tarea.
