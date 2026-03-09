# Especificación Formal de API - Assessment Grading Matrix

Este documento define los contratos de comunicación entre el frontend y el backend (Next.js API Routes). Todos los endpoints deben seguir estas convenciones para asegurar la consistencia y seguridad del sistema.

---

## 🛠️ Convenciones Globales

1. **Métodos HTTP:** 
    - `GET`: Obtención de datos (sin efectos secundarios).
    - `POST`: Creación de recursos o acciones complejas (ej. login, sorteo).
    - `PUT`: Actualización completa o parcial de un recurso.
    - `DELETE`: Eliminación de un recurso.
2. **Formato de Respuesta:** Todas las respuestas exitosas y de error deben ser objetos JSON.
    - **Error (4xx, 5xx):** `{ "error": "Mensaje descriptivo del error" }`
    - **Éxito (2xx):** El formato varía según el endpoint, pero debe priorizar `camelCase` para las propiedades.
3. **Autenticación:** 
    - Se requiere el header `Authorization: Bearer <JWT_TOKEN>` para endpoints protegidos.
    - El token debe ser validado mediante el middleware o la utilidad `requireRoles`.
4. **Contexto Obligatorio:** Todo endpoint que opere dentro de un assessment debe requerir explícitamente el parámetro `assessmentId`.

---

## 🔑 Autenticación (Auth)

### `POST /api/auth/login`
Autentica a un usuario (Admin, Registrador o Calificador).

- **Payload:**
    ```json
    { "email": "user@example.com", "password": "secure_password" }
    ```
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

- **Respuesta (200 OK):**
    ```json
    { "message": "string" }
    ```

---

## 🏛️ Gestión Administrativa (Admin/Superadmin)

### `POST /api/assessment/create`
Crea un nuevo proceso evaluativo (Assessment) bajo un Grupo Estudiantil.

- **Payload:**
    ```json
    {
      "grupoEstudiantilId": number,
      "nombre": "string",
      "descripcion": "string (opcional)",
      "activo": boolean (opcional, default true)
    }
    ```
- **Respuesta (200 OK):**
    ```json
    { "message": "Assessment creado", "ID_Assessment": number }
    ```

### `POST /api/assessment/toggle-active`
Activa o desactiva un assessment existente.

- **Payload:**
    ```json
    { "assessmentId": number, "activo": boolean }
    ```
- **Respuesta (200 OK):**
    ```json
    { "message": "Estado del assessment actualizado correctamente" }
    ```

---

## 📋 Configuración de Assessment (Bases y Staff)

### `POST /api/base/create`
Registra una nueva base de evaluación dentro de un assessment.

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
- **Respuesta (201 Created):**
    ```json
    { "message": "Base creada exitosamente", "ID_Base": number }
    ```

### `POST /api/staff/create`
Registra un nuevo miembro del staff (Registrador o Calificador) en un assessment.

- **Payload:**
    ```json
    {
      "assessmentId": number,
      "correo": "string",
      "password": "string",
      "rol": "admin" | "registrador" | "calificador",
      "idBase": number | null (requerido si rol=calificador)
    }
    ```
- **Respuesta (200 OK):**
    ```json
    { "ID_Staff": number }
    ```

---

## 👥 Participantes e Inscripción (Register/Participante)

### `POST /api/register`
Inscribe a un nuevo participante en el sistema.

- **Payload:**
    ```json
    {
      "assessmentId": number,
      "nombre": "string",
      "correo": "string",
      "fotoUrl": "string (opcional)"
    }
    ```
- **Respuesta (201 Created):**
    ```json
    { "ID_Participante": number, "message": "string" }
    ```

### `PUT /api/update-person`
Actualiza los datos de un participante, incluyendo su estado de "Impostor".

- **Payload:**
    ```json
    {
      "id": number,
      "nombre": "string (opcional)",
      "correo": "string (opcional)",
      "isImpostor": boolean (opcional)
    }
    ```
- **Respuesta (200 OK):**
    ```json
    { "message": "Participante actualizado correctamente" }
    ```

### `POST /api/participante/assign-group`
Asigna manualmente un participante a un grupo de evaluación.

- **Payload:**
    ```json
    {
      "assessmentId": number,
      "participanteId": number,
      "grupoAssessmentId": number
    }
    ```
- **Respuesta (200 OK):**
    ```json
    { "message": "Participante asignado al grupo" }
    ```

---

## 🎲 Sorteo y Calificación (Auto-Groups/Grader)

### `POST /api/assessment/auto-groups`
Genera y distribuye participantes en grupos de forma automática.

- **Payload:**
    ```json
    { "assessmentId": number, "numGroups": number }
    ```
- **Respuesta (200 OK):**
    ```json
    { "message": "Grupos creados y sorteados correctamente" }
    ```

### `POST /api/add-calificaciones`
Registra un bloque de calificaciones enviado por un calificador.

- **Payload:**
    ```json
    {
      "idGrupo": number (opcional),
      "calificaciones": [
        {
          "ID_Calificador": number,
          "ID_Base": number,
          "ID_Participante": number,
          "Calificacion_1": number (1..5),
          "Calificacion_2": number (1..5),
          "Calificacion_3": number (1..5)
        }
      ]
    }
    ```
- **Respuesta (200 OK):**
    ```json
    { "message": "✅ Calificaciones procesadas correctamente" }
    ```

---

## 📊 Dashboards y Reportes

### `GET /api/dashboard/config?assessmentId=6`
Obtiene el resumen de configuración de un assessment para la vista de Admin.

### `GET /api/dashboard/gh?assessmentId=6`
Obtiene la sábana completa de resultados de un assessment para la vista de Gestión.

---

_Este documento debe actualizarse ante cualquier cambio en los archivos de `src/pages/api/`._
