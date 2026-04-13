# ADR 0011: Audit Logging and Traceability System

## Status
Accepted

## Context
The system lacked a mechanism to track administrative and sensitive actions. Without traceability, it was impossible to identify which staff member performed critical operations such as creating accounts, deleting assessments, or unauthorized login attempts.

## Decision
We will implement a centralized Audit Logging system using a dedicated `AuditLogs` table in PostgreSQL (Supabase). 

Key characteristics:
- **Insert-Only:** Rows can only be created, never updated or deleted (enforced by RLS).
- **Hybrid Integration:** Explicit logging for high-value actions (Staff/Assessment management) and semi-automated logging for authentication events.
- **Contextual Data:** Usage of `JSONB` for the `Detalles` field to allow flexibility in the data captured per event type.

## Consequences
- **Positive:** Full accountability for administrative actions; better security forensics.
- **Negative:** Minor increase in database storage; small performance overhead on logged API calls.
- **Security:** RLS must be strictly configured to prevent log tampering.
