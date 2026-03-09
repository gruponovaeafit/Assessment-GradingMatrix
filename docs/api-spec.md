# Especificación Formal de API - Assessment Grading Matrix

Este documento define los contratos de comunicación entre el frontend y el backend (Next.js API Routes). Todos los endpoints deben seguir estas convenciones para asegurar la consistencia y seguridad del sistema.

---

## 🛠️ Convenciones Globales

1. **Métodos HTTP:** 
    - `GET`: Obtención de datos (sin efectos secundarios).
    - `POST`: Creación de recursos o acciones complejas (ej. login, sorteo).
    - `PUT`: Actualización de un recurso existente.
    - `DELETE`: Eliminación de un recurso.
2. **Formato de Respuesta:** Todas las respuestas exitosas y de error deben ser objetos JSON.
    - **Error (4xx, 5xx):** `{ "error": "Mensaje descriptivo del error" }`
    - **Éxito (2xx):** El formato varía según el endpoint, pero debe priorizar `camelCase` para las propiedades de los objetos de respuesta.
3. **Autenticación:** 
    - Se requiere el header `Authorization: Bearer <JWT_TOKEN>` para endpoints protegidos.
    - El token debe ser validado mediante el middleware o la utilidad `requireRoles`.
4. **Contexto Obligatorio:** Todo endpoint que opere dentro de un assessment debe requerir explícitamente el parámetro `assessmentId`.

---

## 🔑 Autenticación (Auth)

### `POST /api/auth/login`
Autentica a un usuario (Admin, Registrador o Calificador).

- **Payload:** `{ "email": "string", "password": "string" }`
- **Respuesta (200 OK):**
    ```json
    {
      "role": "admin" | "registrador" | "calificador",
      "superAdmin": boolean,
      "token": "string",
      "ID_Base": number | null,
      "ID_Calificador": number | null,
      "message": "string"
    }
    ```

### `POST /api/auth/logout`
Cierra la sesión del usuario actual.

---

## 🏛️ Gestión Administrativa (Admin/Superadmin)

### `GET /api/assessment/list`
Lista todos los assessments disponibles.

### `POST /api/assessment/create`
Crea un nuevo proceso evaluativo (Assessment) bajo un Grupo Estudiantil.

- **Payload:**
    ```json
    {
      "grupoEstudiantilId": number,
      "nombre": "string",
      "descripcion": "string (opcional)",
      "activo": boolean (opcional)
    }
    ```

### `PUT /api/assessment/update`
Actualiza un assessment existente.

- **Payload:** `{ "assessmentId": number, "descripcion": "string", "activo": boolean, "grupoEstudiantilId": number }` (Todos opcionales excepto `assessmentId`).

### `POST /api/assessment/toggle-active`
Activa o desactiva un assessment. Si se activa, desactiva automáticamente los otros assessments del mismo grupo estudiantil.

---

## 📋 Configuración de Bases

### `GET /api/base/list?assessmentId=6`
Obtiene todas las bases configuradas para un assessment específico.

### `POST /api/base/create`
Registra una nueva base de evaluación.

- **Payload:**
    ```json
    {
      "assessmentId": number,
      "numeroBase": number,
      "nombre": "string",
      "competencia": "string",
      "descripcion": "string",
      "comportamiento1": "string",
      "comportamiento2": "string",
      "comportamiento3": "string"
    }
    ```

### `PUT /api/base/update`
Actualiza una base de evaluación existente.

- **Payload:** `{ "idBase": number, ...campos_opcionales }`

### `DELETE /api/base/delete`
Elimina una base si no tiene calificaciones ni staff asociado.

- **Payload:** `{ "idBase": number }`

---

## 👥 Gestión de Staff y Usuarios

### `GET /api/staff/admins`
Lista todos los administradores registrados.

### `POST /api/staff/create`
Registra un nuevo miembro del staff.

- **Payload:** `{ "assessmentId": number, "correo": "string", "password": "string", "rol": "admin" | "registrador" | "calificador", "idBase": number | null }`

### `PUT /api/staff/update`
Actualiza los datos de un miembro del staff.

- **Payload:** `{ "staffId": number, ...campos_opcionales }`

### `GET /api/users`
Lista todos los participantes del assessment seleccionado.

---

## 👤 Participantes

### `GET /api/participante/list?assessmentId=6`
Lista participantes registrados en un assessment.

### `POST /api/register`
Inscribe a un nuevo participante.

- **Payload:** `{ "assessmentId": number, "nombre": "string", "correo": "string", "fotoUrl": "string" }`

### `PUT /api/update-person`
Actualiza datos de un participante (nombre, correo o estado `isImpostor`).

- **Payload:** `{ "id": number, "nombre": "string", "correo": "string", "isImpostor": boolean }`

### `POST /api/participante/assign-group`
Asigna un participante a un `GrupoAssessment`.

---

## 🎲 Grupos y Calificaciones

### `GET /api/assessment/groups?assessmentId=6`
Lista los grupos de evaluación creados para un assessment.

### `POST /api/assessment/auto-groups`
Distribuye participantes en grupos de forma automática, repartiendo equitativamente a los impostores.

- **Payload:** `{ "assessmentId": number, "numGroups": number }`

### `POST /api/add-calificaciones`
Registra calificaciones. Bloquea el envío si el calificador ya calificó al mismo grupo en esa base.

- **Payload:** `{ "idGrupo": number, "calificaciones": [{ ... }] }`

---

## 📊 Dashboards

### `GET /api/dashboard/config?assessmentId=6`
Resumen de configuración (visto por Admin).

### `GET /api/dashboard/gh?assessmentId=6`
Sábana de resultados y promedios por base (visto por Gestión).

---

_Este documento es la referencia técnica para el desarrollo del frontend y el mantenimiento de los contratos de API._
