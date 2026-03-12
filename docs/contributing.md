# Guía de Contribución

Gracias por ayudar a mejorar Assessment Grading Matrix! Para mantener la calidad y consistencia del proyecto, seguimos estas guías.

---

## Flujo de Trabajo (Git)

1. Branches: Crea una rama desde main con un nombre descriptivo:
    - feat/nombre-de-la-mejora
    - fix/descripcion-del-bug
    - refactor/area-afectada
    - docs/que-se-documenta
2. Commits: Usamos Conventional Commits:
    - feat: ... para nuevas funcionalidades.
    - fix: ... para correcciones de errores.
    - docs: ... para cambios en documentación.
    - refactor: ... para cambios de código que no corrigen bugs ni añaden funciones.

---

## Definition of Done (DoD)

Antes de abrir un Pull Request, asegúrate de cumplir con:

- [ ] Linting: `npm run lint` no debe arrojar errores ni warnings importantes.
- [ ] Tests: `npx vitest run` debe pasar exitosamente. Si añades lógica nueva, incluye su test unitario.
- [ ] Build: `npm run build` debe completar exitosamente.
- [ ] Documentación: Si has cambiado un endpoint, actualiza `docs/api-spec.md`. Si has tomado una decisión arquitectónica, crea un ADR en `docs/decisions/`.
- [ ] Validation: Las respuestas de API en el frontend deben estar validadas con `zod`.
- [ ] Acceptance Criteria: Todos los criterios del issue original deben estar marcados como completados.
- [ ] Mobile First: Si es un cambio en `/register` o `/grader`, verifícalo en modo responsive.

---

## Descripción del Pull Request

Todos los PRs deben incluir la siguiente estructura en su descripción. GitHub la pre-llena automáticamente con la plantilla en `.github/PULL_REQUEST_TEMPLATE.md`.

| Sección | Descripción |
|---------|-------------|
| **Related work item** | `Closes #N` para cerrar el issue automáticamente al hacer merge, o `Relates to #N` si solo está relacionado. |
| **Summary** | 1–3 líneas describiendo qué cambió. |
| **Context** | Por qué fue necesario el cambio. Enlaza ADRs, issues o discusiones si es relevante. |
| **Testing** | Qué probaste localmente o en CI. Incluye comandos, capturas o logs. |
| **Impact** | Cambios breaking, migraciones, capturas de pantalla o notas para el revisor. Omitir si no aplica. |

---

## Cómo Verificar tu Trabajo

### Backend (APIs)
- Prueba los endpoints con curl, Postman o Thunder Client.
- Verifica que los errores (400, 401, 404, 500) devuelvan el formato JSON { "error": "..." }.
- Asegúrate de que los guards de requireRoles funcionan (prueba con un token de otro rol).

### Frontend (UI)
- Verifica estados de Carga (Spinners), Error (Toasts) y Vacío (Empty states).
- Asegúrate de usar authFetch para todas las peticiones protegidas.
- **Estilos**: Se utiliza **Tailwind CSS** para el diseño de componentes, apoyándose en variables CSS globales para mantener la consistencia de marca.
- **Validación**: Usa esquemas de `zod` en `src/features/*/schemas/` para validar los datos que llegan de la API.

---

## Qué evitar

- No formatear archivos ajenos: Configura tu editor para formatear solo las líneas modificadas para evitar diffs ruidosos.
- No ignorar el ADR 0003: No metas lógica compleja en los componentes de `src/app/`. Usa hooks y componentes de feature en `src/features/`.
- No subir secretos: Nunca hagas commit de archivos .env o llaves privadas.

