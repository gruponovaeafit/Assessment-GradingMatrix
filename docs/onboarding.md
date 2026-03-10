# Guía de Onboarding (Paso a Paso)

Esta guía te llevará desde el clonado del repositorio hasta tu primera contribución. Sigue estos pasos para configurar tu entorno de desarrollo.

---

## Checklist del Primer Día

### 1. Preparación del Entorno
- [ ] Asegúrate de tener **Node.js (v20+)** y **npm** instalados.
- [ ] Clona el repositorio: `git clone https://github.com/gruponovaeafit/Assessment-GradingMatrix.git`
- [ ] Instala las dependencias: `npm install`

### 2. Configuración de Variables de Entorno
- [ ] Copia el archivo de ejemplo: `cp .env.example .env.local`
- [ ] Solicita al líder técnico los valores para:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY` (Solo para scripts)
    - `ADMIN_EMAIL` y `ADMIN_PASSWORD` (Para acceso Superadmin local)
    - `JWT_SECRET` (Debe coincidir con el de Supabase Auth si aplica)

### 3. Verificación del Sistema
- [ ] Levanta el servidor de desarrollo: `npm run dev`
- [ ] Abre `http://localhost:3000` en tu navegador.
- [ ] Intenta acceder al Panel Superadmin en `/k7v9x2q0m5p8n1t6z3r4w9y1` usando las credenciales de tu `.env.local`.

---

## Cómo Obtener un Usuario de Prueba

Para probar las funcionalidades de **Admin**, **Registrador** o **Calificador** localmente:

1.  **Vía Superadmin:** Entra al panel superadmin, crea un `GrupoEstudiantil` y luego un `Assessment`. El flujo te permitirá crear un administrador inicial.
2.  **Vía Scripts:** Puedes usar `node scripts/seed-supabase-demo.mjs` (si está configurado) para poblar datos de prueba.
3.  **Vía Supabase Dashboard:** Si tienes acceso al dashboard de Supabase, puedes insertar registros directamente en la tabla `Staff` y luego hacer login con ese correo.

---

## Solución de Problemas Comunes (FAQ)

- **"Recibo un error 401 al llamar a las APIs":** Verifica que tu token JWT sea válido. Si has reiniciado Supabase o cambiado el `JWT_SECRET`, limpia el `localStorage` de tu navegador.
- **"El build falla por variables faltantes":** Next.js requiere ciertas variables en tiempo de compilación. Asegúrate de que `.env.local` esté completo antes de ejecutar `npm run build`.
- **"No puedo ver assessments en el panel admin":** Recuerda que los admins ahora están filtrados por `ID_GrupoEstudiantil` (**ADR 0002**). Verifica que tu usuario staff tenga asignado un grupo que posea assessments.

---

## Siguientes Lecturas Obligatorias

Para entender el "por qué" de lo que ves en el código, lee en este orden:
1.  **[Glosario de Dominio](domain-glossary.md):** Para hablar el mismo idioma que el código.
2.  **[Vista General de la Arquitectura](architecture-overview.md):** Para saber dónde poner tu nueva lógica.
3.  **[Roles y Permisos](roles-and-permissions.md):** Para no romper la seguridad.
4.  **[ADRs (Decisiones de Arquitectura)](decisions/):** Para entender la evolución del sistema.
