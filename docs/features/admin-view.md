# Admin View (AdminHub)

## Contexto

Panel principal del administrador. Muestra las opciones de navegación hacia Gestión, Configuración y Bases del assessment.

## Decisiones

- **Fondo bg-gray-100**: Cambio de `bg-white` a `bg-gray-100` para consistencia con Login view.
- **Grid de cards**: `grid-cols-1` en móvil, `md:grid-cols-2` en desktop. La tercera card usa `md:col-span-2` para ocupar todo el ancho.
- **Gap-10**: Espaciado de 10 entre cards (antes era 4).
- **Box para containers**: Uso del componente `Box` para las cards blancas con sombra y borde.
- **Button con variantes**: Uso de `variant="accent"` para botones de navegación y `variant="error"` para cerrar sesión.

## Impacto

- **Componentes usados**: `Box`, `Button` (sistema de diseño compartido)
- **Sin breaking changes**: Solo refactorización visual
- **Consistencia**: AdminHub ahora sigue el mismo sistema de diseño que Login y otras vistas
- **Mantenibilidad**: Cambios de estilo centralizados en `Box.tsx` y `Button.tsx`