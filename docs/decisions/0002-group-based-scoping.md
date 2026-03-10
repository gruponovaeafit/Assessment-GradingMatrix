# ADR 0002: Alcance Administrativo por Grupo Estudiantil

**Estado:** Aceptado  
**Fecha:** 2026-03-09  
**Relacionado con:** #73, #74, #78

## Contexto
Originalmente, los administradores de Staff estaban vinculados directamente a un `ID_Assessment`. Esto significaba que para cada nuevo proceso evaluativo, era necesario crear nuevos accesos o reasignar manualmente al personal.

## Problema
1. **Escalabilidad:** Difícil de gestionar para grupos que manejan múltiples assessments simultáneos.
2. **Fragmentación:** Los datos de un administrador (como su contraseña o correo) estaban atados a un assessment específico, lo que impedía una visión global del grupo.
3. **Mantenibilidad:** El esquema dificultaba que un coordinador viera el progreso de todos los procesos de su área (ej. "Sistemas") sin cambiar de contexto.

## Decisión
Cambiar el vínculo jerárquico de la tabla `Staff`. Ahora, un administrador pertenece a un **Grupo Estudiantil** (`ID_GrupoEstudiantil`) y tiene visibilidad automática sobre todos los assessments generados por ese grupo.

## Consecuencias
- **Positivas:** 
    - Un solo login permite gestionar múltiples assessments.
    - El "Superadmin" ahora delega la gestión a los "Admins de Grupo".
    - Permite una auditoría más clara por unidad organizativa.
- **Negativas:** 
    - Requiere refactorización de todas las consultas SQL y API que asumen `Staff -> Assessment`.
    - Mayor complejidad en la lógica de filtrado inicial en el dashboard.

---
## Estructura de Datos
- **Anterior:** `Staff` -> `FK(Assessment)`
- **Nueva:** `Staff` -> `FK(GrupoEstudiantil)` -> `1:N Assessments`
