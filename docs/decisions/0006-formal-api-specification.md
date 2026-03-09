# ADR 0006: Establecimiento de una Especificación Formal de API

**Estado:** Aceptado  
**Fecha:** 2026-03-09  
**Relacionado con:** #58, #87, #89

## Contexto
El proyecto cuenta con más de 30 endpoints de API distribuidos en `src/pages/api/`. A medida que el sistema crece y se aplican refactorizaciones estructurales (como el paso a `isImpostor` booleano o la obligatoriedad de `assessmentId`), la falta de una documentación centralizada dificulta la consistencia del desarrollo.

## Problema
1. **Inconsistencia de Contratos:** Algunos endpoints usan `snake_case`, otros `camelCase`, y las respuestas de error no están estandarizadas.
2. **Ambigüedad en Refactorizaciones:** Sin una especificación, es difícil asegurar que todos los endpoints han migrado correctamente a los nuevos estándares (ej. ADR 0004 y ADR 0005).
3. **Curva de Aprendizaje:** Los desarrolladores nuevos deben leer el código fuente de cada API para entender qué parámetros enviar y qué esperar.
4. **Acoplamiento Frontend-Backend:** El frontend depende de "conocimiento implícito" sobre las APIs, lo que genera errores cuando los contratos cambian sin previo aviso.

## Decisión
Crear y mantener un documento de **Especificación de API** (`docs/api-spec.md`) que actúe como la "Única Fuente de Verdad" para todos los contratos de comunicación entre el frontend y el backend.

### Reglas de la Especificación:
- **Estandarización de Errores:** Todos los errores deben seguir el formato `{ "error": "Mensaje descriptivo" }`.
- **Nomenclatura:** Se preferirá `camelCase` para las propiedades de los objetos JSON de respuesta, mapeando internamente desde el `PascalCase/snake_case` de la base de datos si es necesario.
- **Contexto Obligatorio:** Todo endpoint operativo debe requerir explícitamente el `assessmentId`.
- **Tipado:** Se deben especificar los tipos de datos (string, number, boolean) y si son obligatorios.

## Consecuencias
- **Positivas:** 
    - Facilita la implementación de pruebas automatizadas de integración.
    - Reduce errores de comunicación entre el frontend y el backend.
    - Acelera las refactorizaciones de gran alcance al tener un inventario claro de impactos.
- **Negativas:** 
    - Requiere un esfuerzo adicional de mantenimiento para mantener la documentación sincronizada con el código.
