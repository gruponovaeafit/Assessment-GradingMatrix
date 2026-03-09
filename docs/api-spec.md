# Especificación Formal de API - Assessment Grading Matrix

Este documento define los contratos de comunicación entre el frontend y el backend basado en Next.js API Routes. Incluye endpoints productivos, endpoints internos de mantenimiento y endpoints legacy o de compatibilidad aún presentes en `src/pages/api`.

---

## 🛠️ Convenciones Globales

1. **Métodos HTTP**
   - `GET`: consulta de datos.
   - `POST`: creación de recursos o acciones de negocio.
   - `PUT`: actualización de recursos existentes.
   - `DELETE`: eliminación de recursos.

2. **Formato de Respuesta**
   - **Error estándar:** `{ "error": "Mensaje descriptivo del error" }`
   - **Éxito estándar:** objeto o arreglo JSON según el endpoint.
   - El código actual contiene algunos endpoints legacy que devuelven claves en `PascalCase` o mensajes no normalizados. En esos casos este documento describe el contrato observado.

3. **Autenticación**
   - Los endpoints protegidos requieren `Authorization: Bearer <JWT_TOKEN>`.
   - La autorización se valida mediante `requireRoles(...)` o middleware equivalente.

4. **Contexto de Assessment**
   - Por estándar, los endpoints dependientes de un assessment deben recibir `assessmentId`.
   - **Compatibilidad actual:** algunos handlers usan un assessment por defecto cuando el parámetro no se envía. Esto se indica explícitamente en las notas del endpoint.

5. **Clasificación**
   - **Productivo:** endpoint de uso normal por frontend o flujos de negocio.
   - **Interno:** endpoint operativo, administrativo o de mantenimiento.
   - **Legacy / compatibilidad:** endpoint antiguo o de transición, conservado por integración existente.

---

## 🔑 Autenticación

### `POST /api/auth/login`
Autentica a un usuario `admin`, `registrador` o `calificador`.

- **Payload**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Respuesta (200 OK)**
  ```json
  {
    "role": "admin" | "registrador" | "calificador",
    "superAdmin": true,
    "token": "string",
    "message": "Login exitoso"
  }
  ```
  o
  ```json
  {
    "role": "admin" | "registrador" | "calificador",
    "superAdmin": false,
    "ID_Grupo": null,
    "ID_Base": 1,
    "ID_Calificador": 10,
    "token": "string",
    "message": "Login exitoso"
  }
  ```
- **Errores frecuentes**
  - `400`: credenciales incompletas.
  - `401`: credenciales incorrectas.
  - `500`: configuración de admin incompleta o error interno.

### `POST /api/auth/logout`
Cierra la sesión del usuario autenticado.

- **Auth:** cualquier usuario autenticado.
- **Respuesta (200 OK)**
  ```json
  {
    "message": "Logout ok"
  }
  ```

---

## 🏛️ Gestión Administrativa

### `GET /api/assessment/list`
Lista todos los assessments disponibles.

- **Auth:** `admin`
- **Respuesta (200 OK)**
  ```json
  [
    {
      "id": 1,
      "nombre": "Assessment 2026",
      "activo": true
    }
  ]
  ```

### `GET /api/assessment/list-with-group`
Lista assessments incluyendo grupo estudiantil asociado.

- **Tipo:** productivo
- **Auth:** `admin`
- **Respuesta (200 OK)**
  ```json
  [
    {
      "id": 1,
      "nombre": "Assessment 2026",
      "descripcion": null,
      "activo": true,
      "grupoId": 3,
      "grupoNombre": "Ingeniería"
    }
  ]
  ```

### `POST /api/assessment/create`
Crea un assessment bajo un grupo estudiantil.

- **Auth:** `admin`
- **Payload**
  ```json
  {
    "grupoEstudiantilId": 3,
    "nombre": "Assessment 2026",
    "descripcion": "string",
    "activo": true
  }
  ```
- **Respuesta (200 OK)**
  ```json
  {
    "message": "Assessment creado",
    "ID_Assessment": 12
  }
  ```

### `POST /api/assessment/bulk-create`
Crea assessments masivamente para varios grupos estudiantiles, generando el nombre automáticamente.

- **Tipo:** interno
- **Auth:** `admin`
- **Payload**
  ```json
  {
    "grupoIds": [1, 2, 3],
    "activo": true
  }
  ```
- **Respuesta (200 OK)**
  ```json
  {
    "created": [
      {
        "id": 10,
        "nombre": "Assessment_Ingenieria_2026_S1",
        "grupoId": 1,
        "activo": true
      }
    ],
    "skipped": [
      {
        "grupoId": 2,
        "nombre": "Assessment_Derecho_2026_S1"
      }
    ]
  }
  ```

### `PUT /api/assessment/update`
Actualiza un assessment existente.

- **Auth:** `admin`
- **Payload**
  ```json
  {
    "assessmentId": 12,
    "descripcion": "string",
    "activo": true,
    "grupoEstudiantilId": 3
  }
  ```
- **Notas**
  - `assessmentId` es obligatorio.
  - Si `activo` es `true`, el sistema desactiva otros assessments del mismo grupo estudiantil.
- **Respuesta (200 OK)**
  ```json
  {
    "message": "Assessment actualizado",
    "id": 12
  }
  ```

### `POST /api/assessment/toggle-active`
Activa o desactiva un assessment. Si se activa, desactiva automáticamente otros assessments del mismo grupo.

- **Auth:** `admin`
- **Payload:** contrato observado en código de negocio para alternar estado del assessment.
- **Respuesta (200 OK):** objeto JSON con confirmación de actualización.

### `GET /api/grupo-estudiantil/list`
Lista grupos estudiantiles disponibles.

- **Tipo:** productivo
- **Auth:** `admin`
- **Respuesta (200 OK)**
  ```json
  [
    {
      "id": 1,
      "nombre": "Ingeniería",
      "descripcion": "Grupo principal"
    }
  ]
  ```

### `GET /api/admin/panel-data`
Devuelve datos agregados para el panel administrativo: grupos estudiantiles, assessments y administradores.

- **Tipo:** interno
- **Auth:** `admin`
- **Respuesta (200 OK)**
  ```json
  {
    "groups": [
      {
        "id": 1,
        "nombre": "Ingeniería",
        "descripcion": null
      }
    ],
    "assessments": [
      {
        "id": 2,
        "nombre": "Assessment 2026",
        "descripcion": null,
        "activo": true,
        "grupoId": 1,
        "grupoNombre": "Ingeniería"
      }
    ],
    "admins": [
      {
        "id": 11,
        "correo": "admin@grupo.agm",
        "assessmentId": 2,
        "assessmentNombre": "Assessment 2026",
        "grupoNombre": "Ingeniería"
      }
    ]
  }
  ```

---

## 📋 Configuración de Bases

### `GET /api/base/list?assessmentId=6`
Obtiene todas las bases configuradas para un assessment.

- **Auth:** `admin`
- **Query params**
  - `assessmentId`: obligatorio.

### `POST /api/base/create`
Registra una nueva base de evaluación.

- **Auth:** `admin`
- **Payload**
  ```json
  {
    "assessmentId": 6,
    "numeroBase": 1,
    "nombre": "Comunicación",
    "competencia": "string",
    "descripcion": "string",
    "comportamiento1": "string",
    "comportamiento2": "string",
    "comportamiento3": "string"
  }
  ```

### `PUT /api/base/update`
Actualiza una base de evaluación existente.

- **Auth:** `admin`
- **Payload**
  ```json
  {
    "idBase": 4,
    "nombre": "Nuevo nombre"
  }
  ```

### `DELETE /api/base/delete`
Elimina una base si no tiene calificaciones ni staff asociado.

- **Auth:** `admin`
- **Payload**
  ```json
  {
    "idBase": 4
  }
  ```

### `POST /api/getBaseData`
Obtiene el detalle de una base por ID.

- **Tipo:** legacy / compatibilidad
- **Auth:** no protegido en el código actual.
- **Payload**
  ```json
  {
    "id_base": 4
  }
  ```
- **Respuesta (200 OK)**
  ```json
  {
    "ID_Base": 4,
    "Nombre": "Comunicación",
    "Competencia": "string",
    "Descripcion": "string",
    "Comportamiento1": "string",
    "Comportamiento2": "string",
    "Comportamiento3": "string"
  }
  ```

---

## 👥 Staff y Usuarios

### `GET /api/staff/admins`
Lista administradores registrados.

- **Auth:** `admin`

### `POST /api/staff/create`
Registra un miembro del staff.

- **Auth:** `admin`
- **Payload**
  ```json
  {
    "assessmentId": 6,
    "correo": "staff@example.com",
    "password": "string",
    "rol": "admin",
    "idBase": 2
  }
  ```

### `PUT /api/staff/update`
Actualiza datos de un miembro del staff.

- **Auth:** `admin`
- **Payload**
  ```json
  {
    "staffId": 14,
    "correo": "nuevo@example.com"
  }
  ```

### `POST /api/staff/update-rotation`
Asigna o limpia el grupo de evaluación de un staff.

- **Tipo:** interno
- **Auth:** `admin`
- **Payload**
  ```json
  {
    "staffId": 14,
    "grupoAssessmentId": 7
  }
  ```
  o para limpiar asignación:
  ```json
  {
    "staffId": 14,
    "grupoAssessmentId": null
  }
  ```
- **Respuesta (200 OK)**
  ```json
  {
    "id": 14,
    "correo": "staff@example.com",
    "rol": "calificador",
    "assessmentId": 6,
    "grupoId": 7,
    "grupoNombre": "Grupo2"
  }
  ```

### `POST /api/staff/bulk-create-admins`
Crea administradores automáticamente para assessments activos.

- **Tipo:** interno
- **Auth:** `admin`
- **Payload**
  ```json
  {
    "assessmentIds": [1, 2, 3]
  }
  ```
- **Notas**
  - Si `assessmentIds` no se envía, opera sobre todos los assessments activos.
  - Devuelve contraseñas generadas en texto plano para uso operativo inmediato.
- **Respuesta (200 OK)**
  ```json
  {
    "created": [
      {
        "id": 20,
        "correo": "abc123_5@ingenieria.agm",
        "assessmentId": 5,
        "assessmentNombre": "Assessment 2026",
        "grupoNombre": "Ingeniería",
        "password": "string"
      }
    ],
    "skipped": [
      {
        "id": 5,
        "nombre": "Assessment 2026",
        "grupoNombre": "Ingeniería"
      }
    ]
  }
  ```

### `GET /api/users`
Lista participantes del assessment por defecto.

- **Auth:** `admin`
- **Notas**
  - El código actual resuelve el assessment mediante un valor por defecto.
- **Respuesta (200 OK)**
  ```json
  [
    {
      "ID": 1,
      "Participante": "Ana",
      "Nombre": "Ana",
      "Correo": "ana@example.com",
      "role": "0"
    }
  ]
  ```

### `POST /api/users`
Registra rápidamente un participante en el assessment por defecto.

- **Tipo:** legacy / compatibilidad
- **Auth:** `admin`
- **Payload**
  ```json
  {
    "nombre": "Ana",
    "correo": "ana@example.com"
  }
  ```
- **Respuesta (200 OK)**
  ```json
  {
    "message": "Persona inscrita exitosamente"
  }
  ```

### `POST /api/getCalificador`
Obtiene el correo de un calificador por ID.

- **Tipo:** legacy / compatibilidad
- **Auth:** `admin`, `calificador`
- **Payload**
  ```json
  {
    "id_calificador": 14
  }
  ```
- **Respuesta (200 OK)**
  ```json
  {
    "Correo": "grader@example.com"
  }
  ```

---

## 👤 Participantes

### `GET /api/participante/list?assessmentId=6`
Lista participantes registrados en un assessment.

- **Auth:** `admin`

### `POST /api/register`
Inscribe un nuevo participante.

- **Auth:** `admin`, `registrador`
- **Payload**
  ```json
  {
    "assessmentId": 6,
    "nombre": "Ana",
    "correo": "ana@example.com",
    "fotoUrl": "string"
  }
  ```

### `PUT /api/update-person`
Actualiza nombre, correo o estado `isImpostor` de un participante.

- **Auth:** `admin`, `registrador`
- **Payload**
  ```json
  {
    "id": 99,
    "nombre": "Ana Torres",
    "correo": "ana@example.com",
    "isImpostor": false
  }
  ```

### `POST /api/participante/assign-group`
Asigna un participante a un `GrupoAssessment`.

- **Auth:** `admin`
- **Payload:** contrato de negocio para asociar participante y grupo.

---

## 🎲 Grupos y Calificaciones

### `GET /api/assessment/groups?assessmentId=6`
Lista los grupos de evaluación creados para un assessment.

- **Auth:** `admin`

### `GET /api/assessment/groups-active?assessmentId=6`
Lista únicamente los grupos que tienen participantes asignados en un assessment.

- **Tipo:** productivo
- **Auth:** `admin`
- **Respuesta (200 OK)**
  ```json
  [
    {
      "id": 7,
      "nombre": "Grupo1"
    }
  ]
  ```

### `POST /api/assessment/auto-groups`
Distribuye participantes automáticamente en grupos, repartiendo impostores de forma equilibrada.

- **Auth:** `admin`
- **Payload**
  ```json
  {
    "assessmentId": 6,
    "numGroups": 4
  }
  ```

### `POST /api/groups`
Persiste una distribución de grupos en el assessment por defecto.

- **Tipo:** legacy / compatibilidad
- **Auth:** `admin`
- **Payload**
  ```json
  {
    "groups": [
      [{ "ID": 1 }, { "ID": 2 }],
      [{ "ID": 3 }]
    ]
  }
  ```
- **Notas**
  - Genera nombres `Grupo1`, `Grupo2`, etc.
  - Limpia asignaciones previas antes de volver a asignar participantes.

### `POST /api/groupsId`
Obtiene los miembros del grupo asignado a un calificador.

- **Tipo:** legacy / compatibilidad
- **Auth:** `admin`, `calificador`
- **Payload**
  ```json
  {
    "idCalificador": 14
  }
  ```
- **Respuesta (200 OK)**
  ```json
  [
    {
      "ID_Persona": 30,
      "ID": 30,
      "Nombre": "Ana",
      "role": "0",
      "Grupo": "Grupo1",
      "Photo": "https://..."
    }
  ]
  ```

### `POST /api/grader/groups`
Lista los grupos del assessment del calificador que aún no han sido calificados para una base.

- **Tipo:** productivo
- **Auth:** `admin`, `calificador`
- **Payload**
  ```json
  {
    "idCalificador": 14,
    "idBase": 2
  }
  ```
- **Respuesta (200 OK)**
  ```json
  [
    {
      "id": 7,
      "nombre": "Grupo1"
    }
  ]
  ```

### `POST /api/grader/participants`
Lista los participantes de un grupo para ser calificados por un calificador.

- **Tipo:** productivo
- **Auth:** `admin`, `calificador`
- **Payload**
  ```json
  {
    "idCalificador": 14,
    "idGrupo": 7
  }
  ```
- **Respuesta (200 OK)**
  ```json
  [
    {
      "ID_Persona": 30,
      "ID": 30,
      "Nombre": "Ana",
      "role": "0",
      "Grupo": "Grupo1",
      "Photo": "https://..."
    }
  ]
  ```

### `POST /api/check-already-graded`
Verifica si un calificador ya calificó un grupo en una base.

- **Tipo:** productivo
- **Auth:** `admin`, `calificador`
- **Payload**
  ```json
  {
    "idCalificador": 14,
    "idBase": 2,
    "idGrupo": 7
  }
  ```
- **Respuesta (200 OK)**
  ```json
  {
    "alreadyGraded": true,
    "message": "Ya has calificado a este grupo anteriormente"
  }
  ```

### `POST /api/get-calificaciones-by-calificador`
Obtiene las calificaciones emitidas por un calificador en una base.

- **Tipo:** productivo
- **Auth:** `admin`, `calificador`
- **Payload**
  ```json
  {
    "idCalificador": 14,
    "idBase": 2
  }
  ```
- **Respuesta (200 OK)**
  ```json
  {
    "calificaciones": [
      {
        "ID_Participante": 30,
        "Calificacion_1": 4.5,
        "Calificacion_2": 4.0,
        "Calificacion_3": 5.0
      }
    ],
    "count": 1
  }
  ```

### `POST /api/add-calificaciones`
Registra calificaciones para los participantes de un grupo.

- **Auth:** `admin`, `calificador`
- **Payload**
  ```json
  {
    "idGrupo": 7,
    "calificaciones": [
      {
        "idParticipante": 30,
        "idBase": 2,
        "calificacion1": 4.5,
        "calificacion2": 4.0,
        "calificacion3": 5.0
      }
    ]
  }
  ```
- **Notas**
  - El flujo bloquea envíos duplicados para la misma base y grupo del mismo calificador.

---

## 📊 Dashboards y Reportes

### `GET /api/dashboard/config?assessmentId=6`
Devuelve el resumen de configuración para dashboard administrativo.

- **Auth:** `admin`
- **Uso esperado:** `GET`
- **Notas**
  - El código actual acepta `assessmentId` opcional y usa un assessment por defecto si no se envía.
  - El handler actual no valida método explícitamente, pero debe consumirse vía `GET`.

### `GET /api/dashboard/gh?assessmentId=6`
Devuelve la sábana de resultados y promedios por base.

- **Auth:** `admin`
- **Uso esperado:** `GET`
- **Notas**
  - El código actual usa `assessmentId` opcional y cae al assessment por defecto.
  - El handler actual no valida método explícitamente, pero debe consumirse vía `GET`.

### `GET /api/dashboard/rotations?assessmentId=6`
Lista las rotaciones de calificadores, incluyendo base y grupo asignados.

- **Tipo:** interno
- **Auth:** `admin`
- **Query params**
  - `assessmentId`: opcional. Si no se envía, lista rotaciones de todos los assessments.
- **Respuesta (200 OK)**
  ```json
  [
    {
      "id": 14,
      "correo": "grader@example.com",
      "rol": "calificador",
      "assessmentId": 6,
      "baseId": 2,
      "baseNombre": "Comunicación",
      "baseNumero": 1,
      "grupoId": 7,
      "grupoNombre": "Grupo1"
    }
  ]
  ```

---

## 🧰 Internos y Mantenimiento

### `GET /api/db`
Endpoint de verificación de conexión con Supabase.

- **Tipo:** interno
- **Auth:** `admin`
- **Uso esperado:** `GET`
- **Notas**
  - Usa el assessment por defecto para verificar conectividad.
  - El handler actual no valida método explícitamente.
- **Respuesta (200 OK)**
  ```json
  {
    "message": "Conexión exitosa",
    "assessmentId": 6
  }
  ```

### `POST /api/admin/hash-passwords`
Migra contraseñas almacenadas en texto plano a hashes seguros.

- **Tipo:** interno
- **Auth:** `admin`
- **Respuesta (200 OK)**
  ```json
  {
    "message": "Se hashearon 3 contraseñas correctamente",
    "updated": 3
  }
  ```

---

## 🧪 Legacy y Compatibilidad

### `GET /api/forms`
Endpoint mínimo de prueba del backend.

- **Tipo:** legacy
- **Auth:** no requiere autenticación.
- **Respuesta (200 OK)**
  ```json
  {
    "message": "Hello from the backend!"
  }
  ```

### `POST /api/groupG`
Genera grupos a partir de una base mock en memoria.

- **Tipo:** legacy
- **Auth:** no requiere autenticación.
- **Payload**
  ```json
  {
    "groups": 4
  }
  ```
- **Respuesta (200 OK)**
  ```json
  {
    "message": "Groups generated",
    "groups": [["Alice"], ["Bob"]]
  }
  ```
- **Notas**
  - Usa datos mock.
  - No sigue completamente la convención estándar de errores y mensajes en español.

---

## 📝 Notas de Normalización Pendiente

1. `dashboard/config`, `dashboard/gh` y `db` deberían validar explícitamente `GET` para alinearse con la convención global.
2. `users` mezcla operaciones `GET` y `POST` en un solo endpoint; se conserva por compatibilidad.
3. `getBaseData`, `getCalificador`, `groups`, `groupsId`, `forms` y `groupG` conservan nomenclaturas o contratos legacy.
4. Los endpoints que hoy usan assessment por defecto deberían migrar gradualmente a requerir `assessmentId` explícito si se desea cumplir estrictamente la convención global.

---

_Este documento es la referencia técnica para el desarrollo del frontend, la operación administrativa y el mantenimiento de contratos API en el proyecto._
