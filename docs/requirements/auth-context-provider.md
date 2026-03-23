# [REQ] Centralización de Autenticación mediante AuthContext Provider

## Descripción
Actualmente, los hooks de autenticación (`useAdminAuth`, `useGraderAuth`, `useSuperAdminAuth`) funcionan de manera independiente, disparando múltiples llamadas redundantes al endpoint `/api/auth/me` cada vez que se montan. Esto genera una carga innecesaria en el servidor y un comportamiento ineficiente en el cliente (múltiples 401 en el login, condiciones de carrera). Se requiere implementar un `AuthProvider` centralizado que gestione el estado de la sesión una sola vez y lo distribuya a toda la aplicación.

## Usuarios afectados
- Desarrolladores (mejor mantenibilidad).
- Usuarios finales (mejor rendimiento y transiciones de página más limpias).

## Criterios de aceptación
- [ ] **Creación del Contexto**: Implementar `AuthContext` y `AuthProvider` en `src/lib/auth/AuthContext.tsx`.
- [ ] **Llamada Única**: El `AuthProvider` debe realizar una única llamada inicial a `/api/auth/me` al cargar la aplicación.
- [ ] **Refactor de Hooks**:
    - [ ] Modificar `useAdminAuth` para consumir el contexto en lugar de hacer fetch propio.
    - [ ] Modificar otros hooks de auth relacionados para usar el estado compartido.
- [ ] **Persistencia de Estado**: El estado de "cargando" debe ser global para evitar parpadeos de UI (FOUC).
- [ ] **Optimización de Network**: Al cargar el login, solo debe verse una llamada a `/api/auth/me` (o dos en StrictMode de desarrollo).

## Alcance técnico
- `src/lib/auth/AuthContext.tsx`: Nuevo archivo para el contexto.
- `src/app/layout.tsx`: Envolver la aplicación con el `AuthProvider`.
- `src/hooks/useAdminAuth.ts`: Refactorización.
- Otros hooks en `src/hooks/` que realicen validación de sesión.

## Consideraciones / Riesgos
- **Breaking Changes**: Asegurar que todos los componentes que dependen de `authLoading` o `isAdmin` sigan funcionando correctamente tras el cambio al contexto.
- **SSR vs Client**: El provider debe ser un "client component" ya que depende de efectos y estado de React.

## Dependencias
- Ninguna.
