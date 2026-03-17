# ADR 0008: Reciclaje de Staff vs Migración de Esquema

**Estado:** Propuesto  
**Fecha:** 2026-03-14  
**Relacionado con:** ADR 0002, ADR 0004

## Contexto
El ADR 0002 propuso mover la tabla `Staff` al nivel de `GrupoEstudiantil` para permitir que los usuarios persistieran entre diferentes assessments semestrales. Sin embargo, esto introdujo un riesgo operativo crítico: al no estar vinculados a un evento específico, un calificador podría registrar datos en el assessment equivocado si el "assessment activo" cambia durante su jornada.

## Problema
1. **Seguridad Operativa**: El personal de campo (calificadores/registradores) trabaja en condiciones de alta presión; cualquier ambigüedad en el destino de los datos es inaceptable.
2. **Auditoría**: Es imperativo saber qué persona específica fue autorizada para qué evento específico en un momento dado.
3. **Determinismo (ADR 0004)**: El destino de un POST no debe inferirse de un estado global mutable de la DB.

## Decisión
Mantener a **todo el Staff** vinculado a un `ID_Assessment` único para garantizar integridad referencial y determinismo. 

La escalabilidad y persistencia de cuentas se resolverá mediante un flujo de **"Reciclaje de Staff"** situado en los dashboards correspondientes:

### Flujo de Reciclado:
1. **Super-Admin**: Puede "importar" **Admins** (u otro staff) de assessments previos del mismo Grupo Estudiantil al crear o configurar un proceso.
2. **Admin de Grupo**: Puede "importar" **Calificadores y Registradores** de assessments previos del mismo Grupo Estudiantil para el proceso actual.
3. El sistema busca registros históricos en la tabla `Staff` filtrando por `ID_GrupoEstudiantil` (vía la relación `Assessment -> GrupoEstudiantil`) y crea nuevas entradas vinculadas al assessment objetivo.

## Consecuencias
- **Positivas:** 
    - Seguridad de datos garantizada por restricciones de integridad referencial.
    - Auditoría clara y aislada por evento académico.
    - Cumplimiento estricto del ADR 0004 (determinismo).
- **Negativas:** 
    - La tabla `Staff` acumulará más filas (histórico), lo cual es deseable para auditoría pero requiere gestión de limpieza a largo plazo.
    - Mayor trabajo de implementación en la UI de Administración para el flujo de invitación.
