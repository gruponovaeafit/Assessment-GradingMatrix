# Especificación Formal de API - Assessment Grading Matrix

Este documento define los contratos de comunicación entre el frontend y el backend basado en Next.js API Routes. Incluye endpoints productivos, endpoints internos de mantenimiento y endpoints legacy o de compatibilidad aún presentes en src/pages/api.

---

## Convenciones Globales

1. Métodos HTTP
   - GET: consulta de datos.
   - POST: creación de recursos o acciones de negocio.
   - PUT: actualización de recursos existentes.
   - DELETE: eliminación de recursos.

2. Formato de Respuesta
   - Error estándar: { "error": "Mensaje descriptivo del error" }
   - Éxito estándar: objeto o arreglo JSON según el endpoint.
   - El código actual contiene algunos endpoints legacy que devuelven claves en PascalCase o mensajes no normalizados. En esos casos este documento describe el contrato observado.

3. Autenticación
   - Los endpoints protegidos requieren Authorization: Bearer <JWT_TOKEN>.
   - La autorización se valida mediante requireRoles(...) o middleware equivalente.

4. Contexto de Assessment
   - Por estándar, los endpoints dependientes de un assessment deben recibir assessmentId.
   - Compatibilidad actual: algunos handlers usan un assessment por defecto cuando el parámetro no se envía. Esto se indica explícitamente en las notas del endpoint.

5. Clasificación
   - Productivo: endpoint de uso normal por frontend o flujos de negocio.
   - Interno: endpoint operativo, administrativo o de mantenimiento.
   - Legacy / compatibilidad: endpoint antiguo o de transición, conservado por integración existente.



6. Resolución y validación de `assessmentId`

    Como parte del requerimiento **[REQ] Eliminar fallback `getDefaultAssessmentId` y requerir `assessmentId` explícito (#58)**, se implementó una capa centralizada para la **resolución y validación de `assessmentId`** en:

    `src/lib/assessment.ts`

    El objetivo es asegurar que **todos los flujos del sistema utilicen un `assessmentId` explícito y válido**, eliminando cualquier inferencia o valor por defecto.

    ---

    #### Resumen de cambios
    - `assessmentId` es obligatorio en todos los endpoints y vistas que operan sobre un assessment específico.
    - No se infiere más el `assessmentId` en runtime ni en backend ni en frontend.
    - Los endpoints retornan 400 si `assessmentId` falta o es inválido.
    - El frontend siempre debe enviar `assessmentId` en los flujos afectados.
    - Se mantiene la consistencia de contrato de error (`{ error: string }`) y códigos HTTP.
    - Se eliminaron las funciones y rutas relacionadas con `getDefaultAssessmentId`.

    #### Endpoints afectados
    - `/api/register`
    - `/api/update-person` (obtiene el assessmentId de la persona por medio de la funcion getAssessmentIdForParticipant)
    - `/api/dashboard/config`
    - `/api/dashboard/gh`
    - `/api/groups/index`
    - `/api/users/index`
    - `/api/db` (ya no requiere `assessmentId` para verificación de conexión)
    - Vistas cliente: `src/app/admin/**`, `page.tsx`, y relacionadas

    #### Ejemplo de contrato actualizado
    **Antes (legacy, no recomendado):**
    ```
    GET /api/dashboard/config
    // Si no se enviaba assessmentId, se usaba uno por defecto (legacy)
    ```

    **Ahora (obligatorio):**
    ```
    GET /api/dashboard/config?assessmentId=6
    // assessmentId es obligatorio. Si falta o es inválido, retorna 400.
    ```

    **Ejemplo de error:**
    ```json
    {
      "error": "assessmentId is required"
    }
    ```

    #### Notas de migración
    - No existe fallback: Si el frontend no envía `assessmentId`, la operación falla explícitamente.
    - Compatibilidad: Flujos legacy que no envíen `assessmentId` dejarán de funcionar hasta ser actualizados.
    - Recomendación: Actualiza cualquier integración, script o cliente que consuma estos endpoints para enviar `assessmentId` de forma explícita.

    > **Referencia:** Ver [ADR 0004: Determinismo en API: assessmentId Explícito](../decisions/0004-explicit-assessment-id.md) para el razonamiento y contexto completo de esta decisión.

    ---

    ### Funciones principales

    #### `resolveAssessmentId(data: string | string[] | undefined)`
    Valida y resuelve el `assessmentId` recibido desde diferentes fuentes de la API (query params, body, etc.).

    **Validaciones realizadas:**
    - El parámetro no puede faltar
    - No puede ser un array
    - Debe ser un entero positivo
    - Debe existir en la base de datos

    **Comportamiento:**
    Si alguna validación falla, retorna un error estructurado junto con el status HTTP correspondiente.

    | Caso                          | Status             |
    |-------------------------------|--------------------|
    | Parámetro faltante o inválido  | 400 Bad Request    |
    | `assessmentId` inexistente    | 404 Not Found      |

    **Contrato de error:**
    ```json
    {
      "error": "Descripción del error"
    }
    ```

    **Ejemplo de uso en endpoints:**
    ```ts
    const result = await resolveAssessmentId(req.query.assessmentId);
    if ('error' in result) return res.status(result.status).json({ error: result.error });
    const assessmentId = result.id;
    ```

    ---

    #### `getAssessmentIdForStaff(staffId: number)`
    Obtiene el `assessmentId` asociado a un staff específico.

    - Si existe: `{ id: number }`
    - Si no existe: `{ error: string, status: number }`

    ---

    #### `getAssessmentIdForParticipant(participantId: number)`
    Obtiene el `assessmentId` asociado a un participante específico.

    - Si existe: `{ id: number }`
    - Si no existe: `{ error: string, status: number }`

    ---

    #### Notas de diseño
    - Estas funciones reemplazan cualquier inferencia o fallback previo (`getDefaultAssessmentId`).
    - Se garantiza un contrato de error consistente en toda la API: `{ "error": "mensaje" }` y status HTTP adecuado.
    - El `assessmentId` debe ser siempre explícito y válido en todos los flujos API y UI.

    #### Impacto en la arquitectura
    - Se elimina completamente el fallback automático de assessmentId.
    - Se fuerza a que todos los endpoints y componentes envíen el assessmentId explícitamente.
    - Se centraliza la validación para evitar duplicación de lógica y errores inconsistentes.

    Esto asegura el cumplimiento del requerimiento:

    **[REQ] Eliminar fallback getDefaultAssessmentId y requerir assessmentId explícito (#58).**

    ---

## Autenticación

### POST /api/auth/login
Autentica a un usuario admin, registrador o calificador.

- Payload
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- Respuesta (200 OK)
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
- Errores frecuentes
  - 400: credenciales incompletas.
  - 401: credenciales incorrectas.
  - 500: configuración de admin incompleta o error interno.

### POST /api/auth/logout
Cierra la sesión del usuario autenticado e invalida el token en el servidor.

- Auth: cualquier usuario autenticado.
- Respuesta (200 OK)
  ```json
  {
    "message": "Logout ok"
  }
  ```

### GET /api/auth/me
Valida la sesión actual a través de la cookie `session` y devuelve la información del perfil.

- Auth: cualquier usuario con sesión activa.
- Respuesta (200 OK)
  ```json
  {
    "id": 14,
    "email": "user@example.com",
    "role": "admin" | "calificador" | "registrador",
    "isSuperAdmin": boolean,
    "assessmentId": 6 | null
  }
  ```
- Errores
  - 401: Token inválido, expirado o presente en la blacklist de `RevokedTokens`.

---

## Gestión Administrativa

### GET /api/assessment/list
Lista todos los assessments disponibles.

- Auth: admin
- Respuesta (200 OK)
  ```json
  [
    {
      "id": 1,
      "nombre": "Assessment 2026",
      "activo": true
    }
  ]
  ```

### GET /api/assessment/list-with-group
Lista assessments incluyendo grupo estudiantil asociado.

- Tipo: productivo
- Auth: admin
- Respuesta (200 OK)
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

### POST /api/assessment/create
Crea un assessment bajo un grupo estudiantil. Opcionalmente puede crear un administrador para el mismo de forma atómica.

- Auth: **Superadmin (id:0)**
- Payload
  ```json
  {
    "grupoEstudiantilId": 3,
    "nombre": "Assessment 2026",
    "descripcion": "string",
    "activo": true,
    "admin": {
      "correo": "admin@example.com",
      "password": "securepassword"
    }
  }
  ```
- Respuesta (200 OK)
  ```json
  {
    "message": "Assessment creado exitosamente",
    "ID_Assessment": 12
  }
  ```
- Errores
  - 403: Si el usuario no es superadmin (id:0).
  ```json
  { "error": "Solo el super-admin puede crear assessments" }
  ```

### POST /api/assessment/bulk-create
Crea assessments masivamente para varios grupos estudiantiles, generando el nombre automáticamente.

- Tipo: interno
- Auth: admin
- Payload
  ```json
  {
    "grupoIds": [1, 2, 3],
    "activo": true
  }
  ```
- Respuesta (200 OK)
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

### PUT /api/assessment/update
Actualiza un assessment existente.

- Auth: admin
- Payload
  ```json
  {
    "assessmentId": 12,
    "descripcion": "string",
    "activo": true,
    "grupoEstudiantilId": 3
  }
  ```
- Notas
  - `assessmentId` es obligatorio (en body o query).
  - Si el usuario es **Superadmin (id:0)**, puede actualizar cualquier assessment.
  - Si el usuario es un administrador regular, solo puede actualizar el assessment asociado a su JWT.
  - Si `activo` es true, el sistema desactiva otros assessments del mismo grupo estudiantil.
- Respuesta (200 OK)
  ```json
  {
    "message": "Assessment actualizado",
    "id": 12
  }
  ```

### POST /api/assessment/toggle-active
Activa o desactiva un assessment. Si se activa, desactiva automáticamente otros assessments del mismo grupo.

- Auth: admin
- Payload
  ```json
  {
    "assessmentId": 12,
    "activo": boolean
  }
  ```
- Notas
  - Si el usuario es **Superadmin (id:0)**, puede actuar sobre cualquier assessment.
  - Si el usuario es regular, solo puede actuar sobre su propio assessment.
- Respuesta (200 OK)
  ```json
  {
    "message": "Estado actualizado",
    "active": boolean
  }
  ```

### DELETE /api/assessment/delete
Elimina un assessment y todas sus dependencias (calificaciones, participantes, staff, bases, grupos).

- Auth: **Superadmin (id:0)**
- Payload
  ```json
  {
    "id": 12,
    "password": "string"
  }
  ```
- Notas
  - Requiere que la contraseña coincida con la variable de entorno `ADMIN_DELETE_PASSWORD`.
  - La eliminación es en cascada y definitiva.
- Respuesta (200 OK)
  ```json
  {
    "message": "Assessment eliminado con éxito"
  }
  ```

### POST /api/super-admin/staff-create
Crea un administrador para un assessment específico. Esta ruta bypassa la validación de contexto del JWT para permitir al super-admin crear staff sin perder su sesión global.

- Auth: **Superadmin (id:0)**
- Payload
  ```json
  {
    "assessmentId": 12,
    "correo": "string",
    "password": "string"
  }
  ```
- Notas
  - Valida formato de correo y previene espacios/emojis.
- Respuesta (200 OK)
  ```json
  {
    "message": "Staff creado exitosamente"
  }
  ```

### DELETE /api/assessment/delete-group
Elimina un grupo específico. Desvincula a todos los participantes y staff asociados (set null) antes de borrar el registro del grupo.

- Auth: admin
- Payload
  ```json
  {
    "id": 7
  }
  ```
- Respuesta (200 OK)
  ```json
  {
    "message": "Grupo eliminado con éxito"
  }
  ```

### GET /api/grupo-estudiantil/list
Lista grupos estudiantiles disponibles.

- Tipo: productivo
- Auth: admin
- Respuesta (200 OK)
  ```json
  [
    {
      "id": 1,
      "nombre": "Ingeniería",
      "descripcion": "Grupo principal"
    }
  ]
  ```

### GET /api/admin/panel-data
Devuelve datos agregados para el panel administrativo: grupos estudiantiles, assessments y administradores.

- Tipo: interno
- Auth: admin
- Respuesta (200 OK)
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

---

## Configuración de Bases

### GET /api/base/list?assessmentId=6
Obtiene todas las bases configuradas para un assessment.

- Auth: admin
- Query params
  - assessmentId: obligatorio.

### POST /api/base/create
Registra una nueva base de evaluación.

- Auth: admin
- Payload
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

### PUT /api/base/update
Actualiza una base de evaluación existente.

- Auth: admin
- Payload
  ```json
  {
    "idBase": 4,
    "nombre": "Nuevo nombre"
  }
  ```

### DELETE /api/base/delete
Elimina una base si no tiene calificaciones ni staff asociado.

- Auth: admin
- Payload
  ```json
  {
    "idBase": 4
  }
  ```

### POST /api/getBaseData
Obtiene el detalle de una base por ID.

- Tipo: legacy / compatibilidad
- Auth: no protegido en el código actual.
- Payload
  ```json
  {
    "id_base": 4
  }
  ```
- Respuesta (200 OK)
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

## Staff y Usuarios

### GET /api/staff/list
Lista todo el personal (admins, calificadores, registradores) asociado al assessment del usuario autenticado.

- Auth: admin
- Respuesta (200 OK): Arreglo de objetos con datos de staff normalizados (ID, Correo, rol, Active, etc).

### GET /api/staff/admins
Lista administradores registrados.

- Auth: admin

### POST /api/staff/create
Registra un miembro del staff.

- Auth: admin
- Payload
  ```json
  {
    "correo": "staff@example.com",
    "password": "string",
    "rol": "admin" | "calificador" | "registrador",
    "idBase": 2 (opcional, solo para calificador)
  }
  ```

### PUT /api/staff/update-active
Actualiza datos de un miembro del staff, incluyendo su estado activo y rol.

- Auth: admin
- Payload
  ```json
  {
    "id": 14,
    "correo": "nuevo@example.com",
    "role": "admin",
    "active": true
  }
  ```
- Respuesta (200 OK)
  ```json
  {
    "message": "Staff actualizado correctamente"
  }
  ```

### POST /api/staff/update-rotation
Asigna o limpia el grupo de evaluación de un staff.

- Tipo: interno
- Auth: admin
- Payload
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
- Respuesta (200 OK)
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

### POST /api/staff/bulk-create-admins
Crea administradores automáticamente para assessments activos.

- Tipo: interno
- Auth: admin
- Payload
  ```json
  {
    "assessmentIds": [1, 2, 3]
  }
  ```
- Notas
  - Si assessmentIds no se envía, opera sobre todos los assessments activos.
  - Devuelve contraseñas generadas en texto plano para uso operativo inmediato.
- Respuesta (200 OK)
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

### GET /api/users
Lista participantes del assessment por defecto.

- Auth: admin
- Notas
  - El código actual resuelve el assessment mediante un valor por defecto.
- Respuesta (200 OK)
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

### POST /api/users
Registra rápidamente un participante en el assessment por defecto.

- Tipo: legacy / compatibilidad
- Auth: admin
- Payload
  ```json
  {
    "nombre": "Ana",
    "correo": "ana@example.com"
  }
  ```
- Respuesta (200 OK)
  ```json
  {
    "message": "Persona inscrita exitosamente"
  }
  ```

### POST /api/getCalificador
Obtiene el correo de un calificador por ID.

- Tipo: legacy / compatibilidad
- Auth: admin, calificador
- Payload
  ```json
  {
    "id_calificador": 14
  }
  ```
- Respuesta (200 OK)
  ```json
  {
    "Correo": "grader@example.com"
  }
  ```

---

## Participantes

### GET /api/participante/list?assessmentId=6
Lista participantes registrados en un assessment.

- Auth: admin

### POST /api/register
Inscribe un nuevo participante.

- Auth: admin, registrador
- Payload (multipart/form-data)
  - `assessmentId`: number (opcional si el usuario es admin y se usa el de su JWT)
  - `nombre`: string
  - `correo`: string
  - `isImpostor`: boolean (string "true" / "false" en el form-data)
  - `image`: File (opcional, imagen del participante)
- Respuesta (200 OK)
  ```json
  {
    "message": "Persona registrada correctamente",
    "id": 42
  }
  ```

### PUT /api/update-person
Actualiza nombre, correo o estado isImpostor de un participante.

- Auth: admin, registrador
- Payload
  ```json
  {
    "id": 99,
    "nombre": "Ana Torres",
    "correo": "ana@example.com",
    "isImpostor": false
  }
  ```

### POST /api/participante/assign-group
Asigna un participante a un GrupoAssessment.

- Auth: admin
- Payload: contrato de negocio para asociar participante y grupo.

---

## Grupos y Calificaciones

### GET /api/assessment/groups?assessmentId=6
Lista los grupos de evaluación creados para un assessment.

- Auth: admin
- Query params
  - assessmentId: obligatorio.
- Notas
  - Si el usuario es **Superadmin (id:0)**, utiliza el ID del query.
  - Si es regular, ignora el query y utiliza el ID de su JWT.

### GET /api/assessment/groups-active?assessmentId=6
Lista únicamente los grupos que tienen participantes asignados en un assessment.

- Tipo: productivo
- Auth: admin
- Query params
  - assessmentId: obligatorio.
- Notas
  - Aplica la misma resolución que `/api/assessment/groups`.
- Respuesta (200 OK)
  ```json
  [
    {
      "id": 7,
      "nombre": "Grupo1"
    }
  ]
  ```

### POST /api/assessment/auto-groups
Distribuye participantes automáticamente en grupos, repartiendo impostores de forma equilibrada.

- Auth: admin
- Payload
  ```json
  {
    "assessmentId": 6,
    "numGroups": 4
  }
  ```

### POST /api/groups
Persiste una distribución de grupos en el assessment por defecto.

- Tipo: legacy / compatibilidad
- Auth: admin
- Payload
  ```json
  {
    "groups": [
      [{ "ID": 1 }, { "ID": 2 }],
      [{ "ID": 3 }]
    ]
  }
  ```
- Notas
  - Genera nombres Grupo1, Grupo2, etc.
  - Limpia asignaciones previas antes de volver a asignar participantes.

### POST /api/groupsId
Obtiene los miembros del grupo asignado a un calificador.

- Tipo: legacy / compatibilidad
- Auth: admin, calificador
- Payload
  ```json
  {
    "idCalificador": 14
  }
  ```
- Respuesta (200 OK)
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

### POST /api/grader/groups
Lista los grupos del assessment del calificador que aún no han sido calificados para una base.

- Tipo: productivo
- Auth: admin, calificador
- Payload
  ```json
  {
    "idCalificador": 14,
    "idBase": 2
  }
  ```
- Respuesta (200 OK)
  ```json
  [
    {
      "id": 7,
      "nombre": "Grupo1"
    }
  ]
  ```

### POST /api/grader/participants
Lista los participantes de un grupo para ser calificados por un calificador.

- Tipo: productivo
- Auth: admin, calificador
- Payload
  ```json
  {
    "idCalificador": 14,
    "idGrupo": 7
  }
  ```
- Respuesta (200 OK)
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

### POST /api/check-already-graded
Verifica si un calificador ya calificó un grupo en una base.

- Tipo: productivo
- Auth: admin, calificador
- Payload
  ```json
  {
    "idCalificador": 14,
    "idBase": 2,
    "idGrupo": 7
  }
  ```
- Respuesta (200 OK)
  ```json
  {
    "alreadyGraded": true,
    "message": "Ya has calificado a este grupo anteriormente"
  }
  ```

### POST /api/get-calificaciones-by-calificador
Obtiene las calificaciones emitidas por un calificador en una base.

- Tipo: productivo
- Auth: admin, calificador
- Payload
  ```json
  {
    "idCalificador": 14,
    "idBase": 2
  }
  ```
- Respuesta (200 OK)
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

### POST /api/add-calificaciones
Registra calificaciones para los participantes de un grupo.

- Auth: admin, calificador
- Payload
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
- Notas
  - El flujo bloquea envíos duplicados para la misma base y grupo del mismo calificador.

---

## Dashboards y Reportes

### GET /api/dashboard/config?assessmentId=6
Devuelve el resumen de configuración para dashboard administrativo.

- Auth: admin
- Uso esperado: GET
- Notas
  - El código actual acepta assessmentId opcional y usa un assessment por defecto si no se envía.
  - El handler actual no valida método explícitamente, pero debe consumirse vía GET.

### GET /api/dashboard/gh?assessmentId=6
Devuelve la sábana de resultados y promedios por base.

- Auth: admin
- Uso esperado: GET
- Notas
  - El código actual usa assessmentId opcional y cae al assessment por defecto.
  - El handler actual no valida método explícitamente, pero debe consumirse vía GET.

### GET /api/dashboard/rotations?assessmentId=6
Lista las rotaciones de calificadores, incluyendo base y grupo asignados.

- Tipo: interno
- Auth: admin
- Query params
  - assessmentId: opcional. Si no se envía, lista rotaciones de todos los assessments.
- Respuesta (200 OK)
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

## Internos y Mantenimiento

### GET /api/db
Endpoint de verificación de conexión con Supabase.

- Tipo: interno
- Auth: admin
- Uso esperado: GET
- Notas
  - El handler actual no valida método explícitamente.
- Respuesta (200 OK)
  ```json
  {
    "message": "Conexión exitosa",
    "assessmentId": 6
  }
  ```

### POST /api/admin/hash-passwords
Migra contraseñas almacenadas en texto plano a hashes seguros.

- Tipo: interno
- Auth: admin
- Respuesta (200 OK)
  ```json
  {
    "message": "Se hashearon 3 contraseñas correctamente",
    "updated": 3
  }
  ```

---

## Legacy y Compatibilidad

### GET /api/forms
Endpoint mínimo de prueba del backend.

- Tipo: legacy
- Auth: no requiere autenticación.
- Respuesta (200 OK)
  ```json
  {
    "message": "Hello from the backend!"
  }
  ```

### POST /api/groupG
Genera grupos a partir de una base mock en memoria.

- Tipo: legacy
- Auth: no requiere autenticación.
- Payload
  ```json
  {
    "groups": 4
  }
  ```
- Respuesta (200 OK)
  ```json
  {
    "message": "Groups generated",
    "groups": [["Alice"], ["Bob"]]
  }
  ```
- Notas
  - Usa datos mock.
  - No sigue completamente la convención estándar de errores y mensajes en español.

---

## Notas de Normalización Pendiente

1. dashboard/config, dashboard/gh y db deberían validar explícitamente GET para alinearse con la convención global.
2. users mezcla operaciones GET y POST en un solo endpoint; se conserva por compatibilidad.
3. getBaseData, getCalificador, groups, groupsId, forms y groupG conservan nomenclaturas o contratos legacy.
4. Los endpoints que hoy usan assessment por defecto deberían migrar gradualmente a requerir assessmentId explícito si se desea cumplir estrictamente la convención global.

---

Este documento es la referencia técnica para el desarrollo del frontend, la operación administrativa y el mantenimiento de contratos API en el proyecto.
