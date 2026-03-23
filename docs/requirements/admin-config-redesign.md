# [REQ] Rediseño de Vista de Configuración Admin según Figma

## Descripción
Este requerimiento busca alinear la interfaz de configuración del administrador con los diseños de Figma para mejorar la experiencia de usuario y la gestión del personal (staff). Actualmente, la vista de configuración muestra participantes del assessment, pero se requiere que esta sección pase a mostrar al staff. Además, se introducirá una nueva sección de "Ajustes de grupo" para centralizar la creación, sorteo y edición de grupos, utilizando menús desplegables (overlays) para mantener la limpieza visual y coherencia con el diseño propuesto.

## Usuarios afectados
- Administradores del sistema.

## Criterios de aceptación
- [ ] **Nueva Sección "Ajustes de grupo"**: Debe contener dos botones: "Editar grupos" y "Crear y sortear grupos".
- [ ] **Visualización de Staff**: El componente que actualmente muestra participantes del assessment debe ser modificado para mostrar al Staff.
- [ ] **Menú Desplegable "Crear y sortear grupos"**:
    - [ ] El componente actual de creación y sorteo debe moverse a un menú desplegable (overlay).
    - [ ] Debe incluir botones de "Cancelar" y "Crear y sortear" en la parte inferior.
    - [ ] Estos botones deben ocupar todo el espacio horizontal disponible, repartiéndose casi al 50% cada uno, con un margen entre ellos y márgenes laterales respecto al contenedor.
    - [ ] Debe incluir una "X" de cierre con la misma funcionalidad que el botón "Cancelar".
- [ ] **Vista "Editar grupos"**:
    - [ ] Implementar esta vista dentro de un menú desplegable.
    - [ ] La lógica y funcionalidad deben basarse en lo existente en la sección de Management, pero adaptada al formato de menú desplegable.
    - [ ] El diseño debe ser limpio y funcional para permitir la edición de grupos en un espacio contenido.

## Alcance técnico
- `src/features/admin/configuration/ConfigContainer.tsx`: Reestructuración de la vista principal.
- `src/features/admin/configuration/components/`:
    - Creación de nuevos componentes para los menús desplegables.
    - Adaptación de `ParticipantGrid` o similar para mostrar staff.
    - Modificación de `AutoGroupForm` para integrarse en el overlay.
- `src/features/admin/configuration/hooks/`: Posibles ajustes en `useParticipantsAndGroups` o creación de `useStaffData`.
- `src/features/admin/management/`: Referencia para la lógica de edición de grupos.

## Consideraciones / Riesgos
- **Consistencia de Datos**: Asegurar que el cambio de "Participantes" a "Staff" no rompa otras funcionalidades de la vista de configuración que dependan de la data de participantes.
- **Usabilidad en Desplegables**: La vista de "Editar grupos" puede ser compleja; se requiere un diseño de interfaz robusto para que sea usable dentro de un menú desplegable.
- **Lógica de Sorteo**: Validar que la lógica de "Crear y sortear" se ejecute correctamente desde el nuevo contexto del componente desplegable.

## Dependencias
- Ninguna.
