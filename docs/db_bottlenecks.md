# Reporte de Cuellos de Botella: Base de Datos

Este documento identifica los cambios en el esquema de PostgreSQL (Supabase) que son necesarios para desbloquear los requisitos funcionales actuales. Sin estos cambios, el equipo de desarrollo de la aplicación no puede avanzar en las funcionalidades de ruteo avanzado, gestión multi-assessment y lógica de impostores.

---

## 🚀 Bloqueos Críticos (Nivel 1)

Estos cambios impiden la implementación de la lógica central del negocio definida en los ADRs recientes.

### 1. Participante: De `Rol_Participante` (String) a `Is_Impostor` (Boolean)
*   **Referencia**: [ADR 0005: Modelo de Participante](../docs/decisions/0005-is-impostor-boolean.md)
*   **Estado Actual**: Tipo `varchar(255)`, valores `'0'`, `'1'`.
*   **Cambio Requerido**: Renombrar a `Is_Impostor`, tipo `BOOLEAN`, default `FALSE`.
*   **Funcionalidad Bloqueada**:
    *   **Auto-grupos**: El algoritmo de balanceo de impostores requiere tipos booleanos para cálculos deterministas.
    *   **Dashboard Admin**: El modal de edición de participantes espera un switch/checkbox, no un campo de texto confuso.

### 2. Staff: Mantener Pinned Scope (Seguridad Total)
*   **Decisión Refinada**: Se ha decidido simplificar al máximo: **TODO** el personal (incluyendo Admins) seguirá estando vinculado obligatoriamente a un `ID_Assessment`.
*   **Cambio en DB**: Ninguno. Se mantiene el esquema actual de `Staff -> Assessment`.
*   **Justificación**: Elimina complejidad innecesaria en la base de datos y garantiza que un admin solo pueda afectar al proceso evaluativo para el cual fue facultado. El "reciclaje" de cuentas se manejará a nivel de aplicación en la vista de Super-Admin.

---

## 🛠️ Mejoras Necesarias (Nivel 2)

Cambios recomendados para estabilizar la arquitectura y seguridad.

### 3. Staff: Flag `Is_SuperAdmin`
*   **Contexto**: Actualmente el acceso de Super-Admin está hardcodeado vía variable de entorno (`ADMIN_EMAIL`).
*   **Cambio Requerido**: Agregar columna `Is_SuperAdmin` (BOOLEAN, default FALSE) a `Staff`.
*   **Beneficio**: Permite delegar permisos de super-usuario de forma dinámica sin tocar despliegues/variables de entorno.

### 4. GrupoAssessment: Restricción de Unicidad
*   **Contexto**: Es posible crear grupos con el mismo nombre dentro de un assessment.
*   **Cambio Requerido**: `UNIQUE (ID_Assessment, Nombre_GrupoAssessment)`.
*   **Beneficio**: Evita corrupción de datos y errores de navegación cuando el frontend filtra por nombre de grupo.

---

## 📈 Resumen de Dependencias

| Requisito UI/API | Link | Bloqueo DB |
| --- | --- | --- |
| Sorteo de grupos equilibrado | #87 | `Participante.Is_Impostor` |
| Gestión segura de Calificadores | ADR 0008 | **Mantener Pinned Scope** |
| API `/api/update-person` | docs | `Participante.Is_Impostor` |
