# ADR 0004: Determinismo en API: assessmentId Explícito

**Estado:** Aceptado  
**Fecha:** 2026-03-09  
**Relacionado con:** #58

## Contexto
Varios endpoints de la API utilizaban una función `getDefaultAssessmentId()` para inferir sobre qué proceso actuar si el cliente no enviaba un ID.

## Problema
1. **Ambigüedad:** Si el usuario tiene acceso a múltiples assessments, el sistema podría estar operando sobre uno incorrecto de forma silenciosa.
2. **Dificultad de Debugging:** Los errores de datos eran difíciles de rastrear porque el contexto se resolvía de forma "mágica" en tiempo de ejecución.
3. **Inconsistencia:** Diferentes endpoints resolvían el fallback de maneras ligeramente distintas.

## Decisión
Eliminar el comportamiento implícito. A partir de ahora, **todos los endpoints que requieran contexto de assessment deben recibir el `assessmentId` de forma explícita** en el body o query params.

## Consecuencias
- **Positivas:** 
    - Comportamiento determinista y trazable.
    - Prevención de corrupción de datos cruzados entre assessments.
    - Contratos de API más claros y robustos.
- **Negativas:** 
    - El Frontend debe ser más diligente en pasar el contexto en cada llamada.
    - Requiere actualizar todos los componentes de UI para persistir el ID seleccionado.
