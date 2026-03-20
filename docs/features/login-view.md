# Login View

## Contexto

Vista de autenticación de usuarios. Es el punto de entrada para admins, registradores y calificadores del sistema.

## Decisiones

- **InputBox para inputs**: Se utiliza el componente `InputBox` que incluye el toggle de mostrar/ocultar contraseña. Antes los inputs eran inline.
- **Fondo bg-gray-100**: Cambio de `bg-white` a `bg-gray-100` para mejor contraste con las cards blancas.
- **Responsive padding**: `py-8` en mobile, `py-6` en laptops para evitar scroll innecesario.
- **Footer con margen variable**: `mt-6 lg:mt-8 xl:mt-16` para ajustar según el tamaño de pantalla.

## Impacto

- **Componentes usados**: `Box`, `InputBox`, `Button` (sistema de diseño compartido)
- **Sin breaking changes**: Solo refactorización visual
- **Mejora técnica**: El botón de mostrar/ocultar contraseña ahora funciona correctamente con `bg-transparent appearance-none`
- **Consistencia**: El login ahora usa los mismos componentes que otras vistas del sistema