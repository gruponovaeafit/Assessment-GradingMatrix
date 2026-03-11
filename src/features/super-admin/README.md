# Super Admin Feature

This directory contains the isolated logic and components for the Super Admin panel.

## Isolation Policy

Unlike other administrative features, this module is kept at the top level of `src/features/` to maintain a strict boundary from regular admin tools.

1.  **Isolated Auth:** Uses `useSuperAdminAuth` instead of the general `useAdminAuth`.
2.  **Dedicated Routing:** Manages the internal "hidden" route logic.
3.  **Specific Domains:** Handles cross-assessment operations (Bulk creation, Global user management).

## Architecture

*   **`SuperAdminContainer.tsx`**: The main orchestrator.
*   **`hooks/`**:
    *   `useSuperAdminData`: Fetching and state sync.
    *   `useSuperAdminFilters`: Complex filtering and pagination.
    *   `useSuperAdminActions`: Mutation logic and bulk operations.
*   **`components/`**:
    *   `SuperAdminToolbar`: Unified control center.
    *   `AssessmentList`: Inline editing for assessments.
    *   `AdminUserList`: Global administrator management.
    *   `MassActionModal`: Confirmation UI for bulk operations.
*   **`utils/`**:
    *   `superAdminUtils.ts`: Deterministic hashing and CSV exports.

## Line Count Impact
Original `page.tsx`: ~917 lines.
Refactored `SuperAdminContainer.tsx`: ~200 lines.
