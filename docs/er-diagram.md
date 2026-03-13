# Entity-Relationship Diagram

This document contains an ER diagram of the database schema, reflecting the **live Supabase state** as verified by the introspection script (`scripts/introspect-schema.ts`).

> Last verified: 2026-03-11 via introspection script against live DB.

## Diagram

```mermaid
erDiagram
    GrupoEstudiantil {
        integer ID_GrupoEstudiantil PK
        varchar Nombre_GrupoEstudiantil
        varchar Descripcion_GrupoEstudiantil
        timestamptz CreatedAt_GrupoEstudiantil
    }

    Assessment {
        integer ID_Assessment PK
        integer ID_GrupoEstudiantil FK
        varchar Nombre_Assessment
        varchar Descripcion_Assessment
        boolean Activo_Assessment
        timestamptz CreatedAt_Assessment
    }

    GrupoAssessment {
        integer ID_GrupoAssessment PK
        integer ID_Assessment FK
        integer ID_Staff FK
        varchar Nombre_GrupoAssessment
        varchar Descripcion_GrupoAssessment
        timestamptz CreatedAt_GrupoAssessment
    }

    Bases {
        integer ID_Base PK
        integer ID_Assessment FK
        integer Numero_Base
        varchar Nombre_Base
        varchar Competencia_Base
        varchar Descripcion_Base
        varchar Comportamiento1_Base
        varchar Comportamiento2_Base
        varchar Comportamiento3_Base
    }

    Staff {
        integer ID_Staff PK
        integer ID_Assessment FK
        varchar Correo_Staff
        varchar Contrasena_Staff
        varchar Rol_Staff
        boolean Active
        integer ID_Base FK
        integer ID_GrupoAssessment FK
        integer Rotaciones_Staff
    }

    Participante {
        integer ID_Participante PK
        integer ID_Assessment FK
        integer ID_GrupoAssessment FK
        varchar Nombre_Participante
        varchar Correo_Participante
        varchar Rol_Participante
        varchar FotoUrl_Participante
    }

    CalificacionesPorPersona {
        integer ID_Calificacion PK
        integer ID_Assessment FK
        integer ID_Base FK
        integer ID_Staff FK
        integer ID_Participante FK
        timestamptz Fecha_Calificacion
        numeric Calificacion_1
        numeric Calificacion_2
        numeric Calificacion_3
    }

    GrupoEstudiantil ||--o{ Assessment : "tiene"
    Assessment ||--o{ GrupoAssessment : "divide en"
    Assessment ||--o{ Bases : "contiene"
    Assessment ||--o{ Staff : "incluye"
    Assessment ||--o{ Participante : "evalúa"
    Assessment ||--o{ CalificacionesPorPersona : "registra"
    GrupoAssessment ||--o{ Participante : "agrupa"
    GrupoAssessment }o--o| Staff : "asignado a"
    Staff }o--o| Bases : "califica en"
    Staff }o--o| GrupoAssessment : "pertenece a"
    Bases ||--o{ CalificacionesPorPersona : "evaluada en"
    Staff ||--o{ CalificacionesPorPersona : "registrada por"
    Participante ||--o{ CalificacionesPorPersona : "recibe"
```

## Tables Summary

| Table | Rows (live) | Description |
|-------|-------------|-------------|
| `GrupoEstudiantil` | 1 | Grupo de estudiantes raíz (e.g. Ingeniería de Sistemas) |
| `Assessment` | 3 | Evento de evaluación ligado a un GrupoEstudiantil |
| `GrupoAssessment` | 5 | Subgrupos dentro de un Assessment; tiene un calificador asignado (`ID_Staff`) |
| `Bases` | 6 | Criterios de evaluación por competencia, únicos por Assessment |
| `Staff` | 11 | Calificadores y administradores; puede tener Base y Grupo asignados |
| `Participante` | 29 | Estudiantes a evaluar; pueden tener un grupo asignado |
| `CalificacionesPorPersona` | 17 | Calificaciones (1–5) por comportamiento, sin duplicados por (assessment, base, staff, participante) |

## Key Constraints

- `Bases.Numero_Base` is unique per `Assessment` (`UQ_Bases_Numero_PorAssessment`).
- All FK in `CalificacionesPorPersona` are **composite**, enforcing that Base, Staff, and Participante all belong to the same Assessment.
- `Staff.ID_Base` and `Staff.ID_GrupoAssessment` are nullable (assigned after creation).
- `GrupoAssessment.ID_Staff` is nullable (a group may have no calificador yet).

## Schema Mismatch History

| Date | Table | Change |
|------|-------|--------|
| 2026-03-11 | `GrupoAssessment` | Added `ID_Staff` (nullable FK → Staff) — discovered via introspection, was missing from `schema.sql` |
