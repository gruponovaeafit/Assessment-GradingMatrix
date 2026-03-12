import { useState, useCallback, useRef, useEffect } from 'react';
import { authFetch } from '@/lib/auth/authFetch';
import { 
  SuperAdminPanelDataSchema, 
  type GrupoEstudiantil, 
  type Assessment, 
  type AdminUser 
} from '../schemas/superAdminSchemas';

export function useSuperAdminData(logout: () => void) {
  const [gruposEstudiantiles, setGruposEstudiantiles] = useState<GrupoEstudiantil[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit states moved here for data integrity
  const [adminEdits, setAdminEdits] = useState<Record<number, { correo: string; password: string }>>({});
  const [assessmentEdits, setAssessmentEdits] = useState<
    Record<number, { descripcion: string; activo: boolean; grupoId: string }>
  >({});

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        "/api/admin/panel-data",
        { signal: controller.signal },
        () => logout()
      );

      if (controller.signal.aborted) return;

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error al cargar datos");
      }

      const parsed = SuperAdminPanelDataSchema.safeParse(payload);
      if (!parsed.success) {
        console.error("❌ Validation error:", parsed.error);
        throw new Error("Respuesta del servidor con formato inválido");
      }

      setGruposEstudiantiles(parsed.data.groups);
      setAssessments(parsed.data.assessments);
      setAdmins(parsed.data.admins);

      // Initialize edit states
      const initialAdminEdits: Record<number, { correo: string; password: string }> = {};
      parsed.data.admins.forEach((admin) => {
        initialAdminEdits[admin.id] = { correo: admin.correo, password: "" };
      });
      setAdminEdits(initialAdminEdits);

      const initialAssessmentEdits: Record<number, { descripcion: string; activo: boolean; grupoId: string }> = {};
      parsed.data.assessments.forEach((ass) => {
        initialAssessmentEdits[ass.id] = {
          descripcion: ass.descripcion || "",
          activo: ass.activo,
          grupoId: ass.grupoId ? String(ass.grupoId) : "",
        };
      });
      setAssessmentEdits(initialAssessmentEdits);

    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setError(err.message || "Error desconocido");
    } finally {
      if (abortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  }, [logout]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    gruposEstudiantiles,
    assessments,
    setAssessments,
    admins,
    setAdmins,
    adminEdits,
    setAdminEdits,
    assessmentEdits,
    setAssessmentEdits,
    loading,
    error,
    fetchData
  };
}
