# ADR 0009: Estandarización e Integridad del Entorno de Desarrollo

**Estado:** Aceptado  
**Fecha:** 2026-03-20  
**Relacionado con:** #122

## Contexto
El proyecto ha experimentado variaciones en el archivo `package-lock.json` ("ruido" de metadatos como `peer: true`) causadas por el uso de diferentes versiones de `npm` entre los desarrolladores. Además, el uso de versiones de Node incompatibles puede generar errores difíciles de depurar en el runtime de Next.js.

## Problema
1. **Inconsistencia del Lockfile:** Diferentes versiones de `npm` generan estructuras de lockfile distintas, lo que ensucia los Pull Requests con miles de líneas de cambios irrelevantes.
2. **Inestabilidad del Runtime:** Diferencias entre el entorno local y el entorno de despliegue (Vercel) pueden causar fallos en producción que no se replican localmente.

## Decisión
Implementar una política estricta de versiones para el entorno de desarrollo:

1. **`engines` en `package.json`**: Definir explícitamente las versiones mínimas soportadas de Node y npm.
2. **`engine-strict=true`**: Configurar `.npmrc` para que `npm` bloquee la instalación si el usuario no cumple con las versiones requeridas.
3. **`.nvmrc`**: Proveer un archivo de configuración para que herramientas como `nvm` cambien automáticamente a la versión correcta de Node.

**Versiones estandarizadas:**
- Node: `v20.19.5` (LTS)
- npm: `10.8.2`

## Consecuencias
- **Positivas:** 
    - Eliminación de cambios accidentales en `package-lock.json`.
    - Garantía de que todos los desarrolladores ejecutan el código en el mismo entorno.
    - Alineación con el runtime de producción.
- **Negativas:** 
    - Requiere que los desarrolladores instalen la versión de Node especificada si aún no la tienen.
