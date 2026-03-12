# Solución de Problemas (Troubleshooting)

Este documento recopila problemas comunes y sus soluciones para ahorrarte tiempo durante el desarrollo.

---

## Autenticación y Acceso

### ¿Por qué recibo 401 localmente si mis credenciales son correctas?
- Causa 1: El token JWT en la cookie `session` ha expirado o ya no coincide con el JWT_SECRET de Supabase.
- Solución: Vuelve a iniciar sesión desde `/auth/login` (esto limpia y reemplaza la cookie automáticamente), o bórrala en la pestaña de Application de tu navegador.
- Causa 2: El flag Active del usuario staff en la DB puede estar impidiendo un nuevo login (si la lógica de "sesión única" está activa).
- Solución: Ve a la tabla Staff en Supabase y pon Active = false.

### ¿Por qué el Superadmin no puede crear un Administrador?
- Causa: Un grupo estudiantil solo puede tener un administrador principal por ahora. Si intentas crear uno para un grupo que ya tiene, la API retornará un error.
- Solución: Verifica los registros de la tabla Staff para ese ID_GrupoEstudiantil.

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
