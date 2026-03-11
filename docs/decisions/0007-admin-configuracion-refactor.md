# ADR 0007: Refactor de `src/app/admin/configuracion` por Composición de Features

**Estado:** Propuesto  
**Fecha:** 2026-03-10  
**Relacionado con:** #60, #59, #58

## Contexto
La vista actual `src/app/admin/configuracion/page.tsx` es un componente cliente monolítico de aproximadamente 1,170 líneas. Centraliza múltiples responsabilidades: autenticación, fetching de datos, cancelación de peticiones, validación, filtros, paginación, estado de modales y renderizado extenso de diversas funcionalidades administrativas.

## Problema
1. **Riesgo Operacional:** Al ser una pantalla crítica de configuración, cualquier cambio pequeño en un flujo (ej. creación de assessment) puede impactar accidentalmente otros flujos no relacionados debido al alto acoplamiento de estado.
2. **Carga Cognitiva:** El tamaño del archivo dificulta el razonamiento lógico, incrementando el tiempo de depuración y desarrollo de nuevas funcionalidades.
3. **Contratos Implícitos:** La vista depende en varios puntos de comportamientos implícitos del `assessmentId`, lo cual contradice los objetivos de determinismo del sistema definidos en el ADR 0004.
4. **Baja Testeabilidad:** La estructura actual impide realizar pruebas unitarias sobre la lógica de dominio sin montar toda la interfaz y sus dependencias.

## Decisión
Descomponer `src/app/admin/configuracion/page.tsx` siguiendo el patrón de **Composición de Features** detallado en el ADR 0003, moviendo la lógica interna a un módulo dedicado en `src/features/admin/configuracion/`.

### Estrategia de Implementación:
1. **Punto de Entrada Ligero:** El archivo `page.tsx` en `src/app` actuará solo como un orquestador/contenedor mínimo.
2. **Estructura del Módulo de Feature:**
   - `hooks/`: Extraer la orquestación de datos y estado (ej. `useAssessments`, `useParticipantsAndGroups`).
   - `components/`: Extraer la UI en componentes funcionales enfocados (ej. `AssessmentList`, `CreateAssessmentForm`).
   - `schemas/`: Implementar validación en runtime con `Zod` en la frontera de los hooks para asegurar la integridad de los datos de la API.
3. **Contratos Explícitos:** Forzar el uso de `assessmentId` explícito en todas las interacciones de API dentro de esta feature, alineándose con el ADR 0004.
4. **Ejecución por Fases:** Estabilizar primero el comportamiento actual (limpieza de efectos, manejo de errores) antes de proceder con la extracción de hooks y componentes.

## Consecuencias
- **Positivas:** 
    - Reducción del riesgo de regresiones mediante fronteras de estado aisladas.
    - Mejora significativa en la mantenibilidad y calidad de los code reviews.
    - Base sólida para la implementación de pruebas automatizadas en flujos críticos.
    - Seguridad en runtime mediante la validación de respuestas de API.
- **Negativas:** 
    - Incremento temporal de la complejidad durante las fases de migración.
    - Mayor número de archivos dentro del directorio de la feature.
