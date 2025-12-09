# Assessment-GradingMatrix

Plataforma web con matriz de calificaciones para evaluar participantes en actividades de assessment.

## Tecnologías

- **Framework**: Next.js 14 (App Router + Pages Router mixto)
- **Lenguaje**: TypeScript / React
- **Estilos**: Tailwind CSS
- **Base de datos**: Microsoft SQL Server (Azure SQL)
- **Almacenamiento de imágenes**: Azure Blob Storage

## Requisitos

- Node.js 18+
- npm / yarn / pnpm
- Acceso a una instancia de SQL Server (Azure o local)
- Cuenta de Azure Storage (opcional, para subir fotos)

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los valores:

```env
DB_USER=tu_usuario_sql
DB_PASS=tu_contraseña_sql
DB_NAME=nombre_base_datos
DB_SERVER=servidor.database.windows.net
DB_PORT=1433
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
```

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/gruponovaeafit/Assessment-GradingMatrix.git
cd Assessment-GradingMatrix

# Instalar dependencias
npm install
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
├── app/             # App Router (páginas, componentes, hooks)
│   ├── components/  # Componentes reutilizables (Navbar, Button, etc.)
│   ├── Hooks/       # Hooks personalizados
│   └── ...          # Rutas: register, graderPage, dashboardadmin, final, etc.
└── pages/
    └── api/         # API Routes (Next.js Pages Router)
```

## Contribuir

1. Haz un fork del repositorio.
2. Crea una rama para tu feature: `git checkout -b feat/mi-nueva-funcionalidad`.
3. Haz commit de tus cambios: `git commit -m "feat: descripción"`.
4. Envía un PR a `main`.

## Licencia

MIT © Grupo Nova EAFIT