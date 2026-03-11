# Admin Features Architecture

This directory contains the core logic and components for the administrative dashboard.

## View Decomposition Pattern

To maintain maintainability and responsiveness, our admin views follow these standards:

1.  **Responsive Split:**
    *   **Desktop (`lg:block`):** Always uses a `Table` component for data density.
    *   **Mobile (`lg:hidden`):** Always uses a `CardList` component to stack data vertically.
    *   *Note: Both components consume the same data from the Container hook.*

2.  **Naming Consistency:**
    *   `GestionContainer`: Main container for the "Management" (Gestion) view.
    *   `ConfigContainer`: Main container for the "Configuration" view.
    *   Both views have similar folder structures: `components`, `hooks`, `schemas`, and `utils`.

## Key Files

*   `gestion/components/ParticipantTable.tsx`: Full desktop grid.
*   `gestion/components/ParticipantCardList.tsx`: Mobile card stack.
*   `configuracion/components/ParticipantCard.tsx`: Individual config cards for base settings.

---
*For more technical details, refer to the JSDoc comments within the individual component files.*
