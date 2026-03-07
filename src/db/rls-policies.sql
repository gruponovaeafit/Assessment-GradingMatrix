-- RLS policies (restrict to authenticated users; service_role bypasses RLS)

-- GrupoEstudiantil
DROP POLICY IF EXISTS "public_read_grupoestudiantil" ON public."GrupoEstudiantil";
DROP POLICY IF EXISTS "public_write_grupoestudiantil" ON public."GrupoEstudiantil";
DROP POLICY IF EXISTS "public_update_grupoestudiantil" ON public."GrupoEstudiantil";
DROP POLICY IF EXISTS "auth_read_grupoestudiantil" ON public."GrupoEstudiantil";
DROP POLICY IF EXISTS "auth_write_grupoestudiantil" ON public."GrupoEstudiantil";
DROP POLICY IF EXISTS "auth_update_grupoestudiantil" ON public."GrupoEstudiantil";

CREATE POLICY "auth_read_grupoestudiantil"
ON public."GrupoEstudiantil"
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_grupoestudiantil"
ON public."GrupoEstudiantil"
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_update_grupoestudiantil"
ON public."GrupoEstudiantil"
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Assessment
DROP POLICY IF EXISTS "public_read_assessment" ON public."Assessment";
DROP POLICY IF EXISTS "public_write_assessment" ON public."Assessment";
DROP POLICY IF EXISTS "public_update_assessment" ON public."Assessment";
DROP POLICY IF EXISTS "auth_read_assessment" ON public."Assessment";
DROP POLICY IF EXISTS "auth_write_assessment" ON public."Assessment";
DROP POLICY IF EXISTS "auth_update_assessment" ON public."Assessment";

CREATE POLICY "auth_read_assessment"
ON public."Assessment"
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_assessment"
ON public."Assessment"
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_update_assessment"
ON public."Assessment"
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- GrupoAssessment
DROP POLICY IF EXISTS "public_read_grupoassessment" ON public."GrupoAssessment";
DROP POLICY IF EXISTS "public_write_grupoassessment" ON public."GrupoAssessment";
DROP POLICY IF EXISTS "public_update_grupoassessment" ON public."GrupoAssessment";
DROP POLICY IF EXISTS "auth_read_grupoassessment" ON public."GrupoAssessment";
DROP POLICY IF EXISTS "auth_write_grupoassessment" ON public."GrupoAssessment";
DROP POLICY IF EXISTS "auth_update_grupoassessment" ON public."GrupoAssessment";

CREATE POLICY "auth_read_grupoassessment"
ON public."GrupoAssessment"
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_grupoassessment"
ON public."GrupoAssessment"
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_update_grupoassessment"
ON public."GrupoAssessment"
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Bases
DROP POLICY IF EXISTS "public_read_bases" ON public."Bases";
DROP POLICY IF EXISTS "public_write_bases" ON public."Bases";
DROP POLICY IF EXISTS "public_update_bases" ON public."Bases";
DROP POLICY IF EXISTS "auth_read_bases" ON public."Bases";
DROP POLICY IF EXISTS "auth_write_bases" ON public."Bases";
DROP POLICY IF EXISTS "auth_update_bases" ON public."Bases";

CREATE POLICY "auth_read_bases"
ON public."Bases"
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_bases"
ON public."Bases"
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_update_bases"
ON public."Bases"
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Staff
DROP POLICY IF EXISTS "public_read_staff" ON public."Staff";
DROP POLICY IF EXISTS "public_write_staff" ON public."Staff";
DROP POLICY IF EXISTS "public_update_staff" ON public."Staff";
DROP POLICY IF EXISTS "auth_read_staff" ON public."Staff";
DROP POLICY IF EXISTS "auth_write_staff" ON public."Staff";
DROP POLICY IF EXISTS "auth_update_staff" ON public."Staff";

CREATE POLICY "auth_read_staff"
ON public."Staff"
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_staff"
ON public."Staff"
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_update_staff"
ON public."Staff"
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Participante
DROP POLICY IF EXISTS "public_read_participante" ON public."Participante";
DROP POLICY IF EXISTS "public_write_participante" ON public."Participante";
DROP POLICY IF EXISTS "public_update_participante" ON public."Participante";
DROP POLICY IF EXISTS "auth_read_participante" ON public."Participante";
DROP POLICY IF EXISTS "auth_write_participante" ON public."Participante";
DROP POLICY IF EXISTS "auth_update_participante" ON public."Participante";

CREATE POLICY "auth_read_participante"
ON public."Participante"
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_participante"
ON public."Participante"
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_update_participante"
ON public."Participante"
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- CalificacionesPorPersona
DROP POLICY IF EXISTS "public_read_calificaciones" ON public."CalificacionesPorPersona";
DROP POLICY IF EXISTS "public_write_calificaciones" ON public."CalificacionesPorPersona";
DROP POLICY IF EXISTS "public_update_calificaciones" ON public."CalificacionesPorPersona";
DROP POLICY IF EXISTS "auth_read_calificaciones" ON public."CalificacionesPorPersona";
DROP POLICY IF EXISTS "auth_write_calificaciones" ON public."CalificacionesPorPersona";
DROP POLICY IF EXISTS "auth_update_calificaciones" ON public."CalificacionesPorPersona";

CREATE POLICY "auth_read_calificaciones"
ON public."CalificacionesPorPersona"
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');

CREATE POLICY "auth_write_calificaciones"
ON public."CalificacionesPorPersona"
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "auth_update_calificaciones"
ON public."CalificacionesPorPersona"
FOR UPDATE
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- AuditLogs (solo insert)
DO $$
BEGIN
  IF to_regclass('public."AuditLogs"') IS NOT NULL THEN
    DROP POLICY IF EXISTS "public_insert_auditlogs" ON public."AuditLogs";
    DROP POLICY IF EXISTS "auth_insert_auditlogs" ON public."AuditLogs";
    CREATE POLICY "auth_insert_auditlogs"
    ON public."AuditLogs"
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;
