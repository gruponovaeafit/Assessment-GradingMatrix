# ADR 0005: Modelo de Participante: Flag Is_Impostor

**Estado:** Propuesto  
**Fecha:** 2026-03-09  
**Relacionado con:** #87

## Contexto
La tabla `Participante` utiliza una columna `Rol_Participante` de tipo `varchar` que almacena strings como `'0'` o `'1'` para identificar a los participantes que actúan como "impostores" en las dinámicas.

## Problema
1. **Nomenclatura Confusa:** El nombre `Rol` sugiere una jerarquía de permisos (como Admin/Staff), cuando en realidad es un atributo de comportamiento dentro de la dinámica.
2. **Tipo de Dato Inapropiado:** El uso de strings (`'0'`, `'1'`) para un valor binario es propenso a errores tipográficos y requiere conversiones constantes (`Number()`, `String()`).
3. **Claridad del Dominio:** El código de "auto-grupos" es difícil de leer al depender de comparaciones de strings mágicos.

## Decisión
Refactorizar la columna a un booleano nativo denominado `Is_Impostor`.

### Cambios:
- **Base de Datos:** Renombrar `Rol_Participante` -> `Is_Impostor` y cambiar tipo a `BOOLEAN` con default `FALSE`.
- **API:** Los contratos de respuesta devolverán `isImpostor: true/false`.
- **UI:** Reemplazar inputs de texto por checkboxes o switches.

## Consecuencias
- **Positivas:** 
    - Código más intuitivo y alineado al lenguaje del negocio.
    - Seguridad de tipos nativa.
    - Simplificación de la lógica de sorteo de grupos.
- **Negativas:** 
    - Requiere una migración de datos para convertir los valores actuales.
