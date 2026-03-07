# Assessment-GradingMatrix

Plataforma web con matriz de calificaciones para evaluar participantes en actividades de assessment.

## Tecnologías

- **Framework**: Next.js 14 (App Router + Pages Router mixto)
- **Lenguaje**: TypeScript / React
- **Estilos**: Tailwind CSS
- **Base de datos**: Supabase (PostgreSQL)

## Requisitos

- Node.js 18+
- npm / yarn / pnpm
- Proyecto activo en [Supabase](https://supabase.com)

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores con los de tu proyecto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

> ⚠️ La `SUPABASE_SERVICE_ROLE_KEY` tiene acceso total a la base de datos sin restricciones de RLS. **Nunca** la uses en el frontend ni hagas commit de su valor real.

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/gruponovaeafit/Assessment-GradingMatrix.git
cd Assessment-GradingMatrix

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con los valores de tu proyecto Supabase
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Scripts disponibles

| Comando         | Descripción                       |
| --------------- | --------------------------------- |
| `npm run dev`   | Inicia el servidor en desarrollo  |
| `npm run build` | Genera la build de producción     |
| `npm start`     | Sirve la build de producción      |
| `npm run lint`  | Ejecuta ESLint                    |

## Estructura del proyecto

```
src/
├── app/                      # App Router pages/layouts
│   ├── admin/                # Hub + subrutas: gestion, configuracion, rotaciones, bases
│   ├── auth/login/           # Login
│   ├── grader/               # Vista de calificador
│   ├── info/                 # Página informativa
│   ├── register/             # Registro
│   ├── k7v9x2q0m5p8n1t6z3r4w9y1/  # Ruta de super admin
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ServiceWorkerRegistration.tsx
│   └── UI/                   # Button, Loading, Toast, ConfirmModal
├── hooks/                    # useAdminAuth, useGraderAuth, useStoredId
├── lib/
│   ├── auth/                 # auth helpers + authFetch + apiAuth
│   ├── supabase/             # clients server/client
│   ├── utils/                # sanitize, audit, imageUrl
│   └── assessment.ts
├── db/                       # schema.sql, rls-policies.sql
└── pages/api/                # API Routes (Pages Router)

scripts/                      # Utilidades de verificación/seed/migración
```

## Route Migration (v2)

Los submódulos de administración se consolidaron bajo `/admin/*`.

| Old route | New route |
| --- | --- |
| `/dashboard/gh` | `/admin/gestion` |
| `/dashboard/config` | `/admin/configuracion` |
| `/dashboard/rotations` | `/admin/rotaciones` |
| `/dashboard/bases` | `/admin/bases` |

- Redirects permanentes (HTTP 308) están configurados en `next.config.ts` para compatibilidad hacia atrás.
- `src/app/admin/layout.tsx` es ahora el punto único del auth guard para todas las rutas `src/app/admin/*`.

## Contribuir

1. Haz un fork del repositorio.
2. Crea una rama para tu feature: `git checkout -b feat/mi-nueva-funcionalidad`.
3. Haz commit de tus cambios: `git commit -m "feat: descripción"`.
4. Envía un PR a `main`.

## Licencia

MIT © Grupo Nova EAFIT

## Seguridad

- **Nunca** hagas commit del archivo `.env.local`.
- El `.gitignore` ya lo excluye, pero verifica antes de cada commit con `git status`.
- Si accidentalmente expones una clave, **renuévala inmediatamente** desde el dashboard de Supabase (Settings → API).
- La `SUPABASE_SERVICE_ROLE_KEY` solo debe usarse en API routes server-side o scripts locales.
