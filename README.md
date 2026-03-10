# Assessment-GradingMatrix

Plataforma web con matriz de calificaciones para evaluar participantes en actividades de assessment del Grupo NOVA EAFIT.

---

## Documentación Técnica (Recomendado para Onboarding)

Para entender la arquitectura, el dominio y cómo contribuir, consulta los siguientes documentos:

- **[Guía de Onboarding (Paso a Paso)](docs/onboarding.md)**: Cómo configurar tu entorno local y hacer tu primer login.
- **[Vista General de la Arquitectura](docs/architecture-overview.md)**: El flujo de datos (Next.js + Supabase) y patrones de código.
- **[Glosario de Dominio](docs/domain-glossary.md)**: Diccionario de términos técnicos y de negocio (Assessment, Base, Impostor, etc.).
- **[Especificación de API](docs/api-spec.md)**: Contratos detallados de todos los endpoints de `src/pages/api/`.
- **[Roles y Permisos](docs/roles-and-permissions.md)**: Matriz de acceso por pantalla y por endpoint.
- **[Decisiones de Arquitectura (ADRs)](docs/decisions/)**: Registro de por qué se tomaron decisiones clave (Cookies, Group Scoping, etc.).
- **[Guía de Contribución](docs/contributing.md)**: Reglas de Git, commits y Definition of Done.
- **[Solución de Problemas (Troubleshooting)](docs/troubleshooting.md)**: Soluciones a errores comunes de auth y base de datos.

---

## Tecnologías

- **Framework**: Next.js 14 (App Router + Pages Router mixto)
- **Lenguaje**: TypeScript / React
- **Estilos**: **Vanilla CSS** (Priorizado sobre frameworks para control estético total).
- **Base de datos**: Supabase (PostgreSQL)

---

## Configuración Inicial

1.  **Requisitos:** Node.js 20+, npm.
2.  **Instalación:** `npm install`.
3.  **Variables de Entorno:** Copia `.env.example` a `.env.local` y completa los valores.
    > Nota: La `SUPABASE_SERVICE_ROLE_KEY` **nunca** debe usarse en el frontend.
4.  **Desarrollo:** `npm run dev` abre `http://localhost:3000`.

---

## Estructura del Proyecto

```
src/
├── app/                      # UI (App Router)
│   ├── admin/                # Hub de Administración (Bases, Gestión, Configuración)
│   ├── auth/login/           # Autenticación
│   ├── grader/               # Vista de Calificador (Mobile-first)
│   ├── register/             # Vista de Registrador (Mobile-first)
│   └── k7v9.../              # Panel de Superadmin
├── components/               # Componentes UI reutilizables
├── hooks/                    # Hooks de dominio (Auth, Fetching)
├── lib/                      # Utilidades core (Supabase, Auth, Helpers)
├── db/                       # Esquema SQL y Políticas RLS
└── pages/api/                # Backend (Pages Router)
```

---

## Contribución

Por favor, lee la **[Guía de Contribución](docs/contributing.md)** antes de abrir un Pull Request. 

1.  Usa el template de **Requirement** al crear issues.
2.  Sigue **Conventional Commits** (`feat:`, `fix:`, `docs:`, etc.).
3.  Asegúrate de que `npm run lint` y `npm run build` pasan sin errores.

---

## Licencia

MIT © Grupo Nova EAFIT
