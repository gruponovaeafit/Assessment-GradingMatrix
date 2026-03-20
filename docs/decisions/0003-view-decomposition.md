# ADR 0003: Arquitectura de Frontend: Composición de Vistas

**Estado:** Aceptado  
**Fecha:** 2026-03-09  
**Relacionado con:** #59, #60-66

## Contexto
Muchas de las vistas principales en `src/app/` (ej. `admin/gestion`, `register`) crecieron orgánicamente hasta convertirse en archivos monolíticos de más de 500 líneas de código que mezclan estado, lógica de negocio y JSX extenso.

## Problema
1. **Baja Mantenibilidad:** Es difícil encontrar y corregir errores en componentes gigantes.
2. **Dificultad de Testing:** Probar la lógica de negocio requiere montar toda la UI y sus dependencias de red.
3. **Curva de Aprendizaje:** Los nuevos desarrolladores tardan demasiado en entender el flujo de datos dentro de la vista.

## Decisión
Adoptar un patrón de **Composición de Componentes** y **Separación de Responsabilidades** inspirado en **Feature Sliced Design (FSD)** para todas las vistas críticas.

### Patrón Estándar:
1. **Container (Page):** Se encarga solo de la orquestación, fetching inicial y manejo de layouts.
2. **Domain Hooks:** Extraer la lógica compleja (filtros, mutaciones, estados) a hooks específicos de la feature (ej. `useAssessmentManagement`).
3. **Presentational Components:** Dividir el JSX en componentes pequeños, puros y reutilizables dentro de la carpeta de la feature.
4. **Utilities:** Mover transformaciones de datos a funciones puras en `lib/utils`.

## Consecuencias
- **Positivas:** 
    - Código más legible y testeable.
    - Facilita el trabajo en paralelo de varios desarrolladores.
    - Reducción del riesgo de regresiones al modificar una parte de la UI.
- **Negativas:** 
    - Aumento en el número de archivos por feature.
    - Requiere disciplina para no volver a meter lógica en el JSX.
