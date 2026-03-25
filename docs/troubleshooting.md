# Solución de Problemas (Troubleshooting)

Este documento recopila problemas comunes y sus soluciones para ahorrarte tiempo durante el desarrollo.

---

## Autenticación y Acceso

### ¿Por qué recibo 401 localmente si mis credenciales son correctas?
- Causa 1: El token JWT en la cookie `session` ha expirado o ya no coincide con el JWT_SECRET de Supabase.
- Solución: Vuelve a iniciar sesión desde `/auth/login` (esto limpia y reemplaza la cookie automáticamente), o bórrala en la pestaña de Application de tu navegador.
- Causa 2: El flag `Active` del usuario staff en la DB está en `false`, lo que desactiva la cuenta.
- Solución: Ve a la tabla `Staff` en Supabase y pon `Active = true` para rehabilitar el acceso.

### ¿Por qué recibo 403 "Assessment desactivado" como Superadmin?
- Causa: El assessment al que has cambiado tiene `Activo_Assessment = false`.
- Comportamiento: El sistema entra en modo **Solo Lectura**. Puedes navegar y ver datos, pero no realizar cambios (POST/PUT/DELETE).
- Solución: Si necesitas editar, reactiva el assessment desde el panel de configuración o directamente en la base de datos.

---

## Base de Datos (Supabase)

### ¿Por qué mi cambio en la DB no se refleja en la UI?
- Causa: Es posible que hayas olvidado actualizar el archivo src/db/schema.sql. Recuerda que este archivo es la fuente de verdad para los desarrolladores, pero no sincroniza automáticamente la instancia real de Supabase.
- Solución: Asegúrate de aplicar el cambio vía SQL Editor en el dashboard de Supabase y luego actualizar el archivo local.

### ¿Por qué mis queries a Supabase devuelven un arreglo vacío?
- Causa: Las políticas RLS (Row Level Security) están bloqueando el acceso.
- Solución: Revisa src/db/rls-policies.sql. Si eres un admin, asegúrate de que el registro que buscas pertenezca a tu ID_GrupoEstudiantil.

---

## Construcción y Despliegue

### ¿Por qué npm run build falla por variables de entorno?
- Causa: Next.js necesita variables como NEXT_PUBLIC_SUPABASE_URL disponibles durante el build para inyectarlas en el bundle de cliente.
- Solución: Asegúrate de tener un archivo .env.local válido antes de compilar.

---

## Legacy e inconsistencias

### ¿Por qué algunos campos están en español y otros en inglés?
- Causa: El proyecto está en transición. Estamos migrando a un estándar de nombres descriptivos en inglés para el código (Is_Impostor, assessmentId) pero manteniendo mensajes de cara al usuario en español.
- Solución: Sigue siempre lo definido en el ADR 0005 y la Especificación de API (api-spec.md).

---

¿Encontraste un problema nuevo? Documenta la solución aquí para ayudar a los demás.
