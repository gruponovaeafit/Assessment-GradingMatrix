# 📖 Glosario de Dominio

El proyecto utiliza terminología específica de los procesos evaluativos de EAFIT. Este glosario ayuda a mantener un lenguaje común entre el código, la base de datos y el negocio.

---

| Término | Definición | Referencia en DB |
| --- | --- | --- |
| **Assessment** | Un proceso evaluativo completo (ej. "Assessment de Sistemas 2024-2"). Es el contenedor de todo. | Tabla `Assessment` |
| **Grupo Estudiantil** | Organización académica o administrativa que agrupa múltiples assessments (ej. "Grupo NOVA"). | Tabla `GrupoEstudiantil` |
| **Grupo Assessment** | Subconjunto de participantes creado específicamente para una jornada de evaluación. | Tabla `GrupoAssessment` |
| **Base** | Una estación o competencia específica que se evalúa (ej. "Trabajo en Equipo"). | Tabla `Bases` |
| **Comportamiento** | Indicadores específicos dentro de una Base. Cada Base evalúa 3 comportamientos. | Campos `Comportamiento1_Base`, etc. |
| **Staff** | Los usuarios operativos del sistema: Admins, Registradores y Calificadores. | Tabla `Staff` |
| **Participante** | La persona que está siendo evaluada. | Tabla `Participante` |
| **Impostor** | Un participante "infiltrado" usado para control de calidad. Se reparte equitativamente en los grupos. | `Is_Impostor` (Bool) |
| **Calificador (Grader)** | Miembro del staff asignado a una Base para puntuar a los participantes. | `Staff` con `Rol_Staff = 'calificador'` |
| **Registrador** | Miembro del staff encargado de la inscripción mobile-first. | `Staff` con `Rol_Staff = 'registrador'` |
| **Admin de Grupo** | Administrador con alcance limitado a los assessments de su propio Grupo Estudiantil. | `Staff` con `Rol_Staff = 'admin'` |
| **Superadmin** | Administrador de infraestructura con acceso a todos los grupos y assessments. | Credenciales en `.env` |
| **Calificación** | Puntuación (1 a 5) emitida por un calificador sobre un comportamiento de un participante. | Tabla `CalificacionesPorPersona` |

---

## 🔄 Términos en Transición (ADRs)

- **`Rol_Participante` → `Is_Impostor`:** El campo antiguo era un string (`'0'`, `'1'`). El nuevo modelo usa un booleano explícito (**ADR 0005**).
- **Alcance Admin:** Antes los admins se ataban a un Assessment; ahora se atan a un `GrupoEstudiantil` (**ADR 0002**).
- **Rotación:** Término legado para la asignación de calificadores a grupos. Módulo en proceso de eliminación.
