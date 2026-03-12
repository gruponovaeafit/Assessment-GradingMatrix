import { useState, useCallback } from 'react';
import { authFetch } from '@/lib/auth/authFetch';
import { showToast } from '@/components/UI/Toast';
import { 
  type Assessment, 
  type AdminUser, 
  type GrupoEstudiantil,
  type MassActionItem
} from '../schemas/superAdminSchemas';
import { getBulkAssessmentPayloads, getBulkAdminPayloads } from '../utils/superAdminUtils';

export function useSuperAdminActions(
  logout: () => void,
  gruposEstudiantiles: GrupoEstudiantil[],
  assessments: Assessment[],
  setAssessments: React.Dispatch<React.SetStateAction<Assessment[]>>,
  admins: AdminUser[],
  setAdmins: React.Dispatch<React.SetStateAction<AdminUser[]>>,
  adminEdits: Record<number, { correo: string; password: string }>,
  assessmentEdits: Record<number, { descripcion: string; activo: boolean; grupoId: string }>
) {
  const [loading, setLoading] = useState(false);
  const [massAction, setMassAction] = useState<{
    title: string;
    description: string;
    items: MassActionItem[];
    onConfirm: () => void;
  } | null>(null);

  // Bulk Assessments
  const handleCreateAssessmentsForAllGroups = async (
    payloads: { nombre: string; grupoEstudiantilId: number; exists: boolean }[],
    assessmentActivo: boolean
  ) => {
    setLoading(true);
    try {
      const response = await authFetch(
        "/api/assessment/bulk-create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grupoIds: payloads.map((item) => item.grupoEstudiantilId),
            activo: assessmentActivo,
          }),
        },
        () => logout()
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al crear assessments masivos");
      
      showToast.success(result.message || "Assessments creados correctamente");
      // In a real scenario, we might want to refetch everything, but for now we follow the original logic
      // which implies a reload or manual refetch is needed to see changes if not optimized
    } catch (error: any) {
      showToast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openBulkAssessmentPreview = (assessmentActivo: boolean) => {
    if (gruposEstudiantiles.length === 0) {
      showToast.error("No hay grupos estudiantiles disponibles.");
      return;
    }
    const payloads = getBulkAssessmentPayloads(gruposEstudiantiles, assessments);
    const items: MassActionItem[] = payloads.map((item) => ({
      key: `${item.grupoEstudiantilId}-${item.nombre}`,
      title: item.nombre,
      subtitle: gruposEstudiantiles.find((g) => g.id === item.grupoEstudiantilId)?.nombre ?? "",
      status: item.exists ? "omitir" : "crear",
    }));
    
    setMassAction({
      title: "Crear assessments para todos los grupos",
      description: "Se omitirán los assessments que ya existan.",
      items,
      onConfirm: () => {
        setMassAction(null);
        handleCreateAssessmentsForAllGroups(payloads, assessmentActivo);
      },
    });
  };

  // Bulk Admins
  const handleCreateAdminsForAllAssessments = async (
    payloads: { assessment: Assessment; correo: string; exists: boolean }[]
  ) => {
    setLoading(true);
    try {
      const response = await authFetch(
        "/api/staff/bulk-create-admins",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assessmentIds: payloads.map((item) => item.assessment.id) }),
        },
        () => logout()
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al crear admins masivos");
      
      showToast.success(result.message || "Admins creados correctamente");
    } catch (error: any) {
      showToast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const openBulkAdminPreview = () => {
    const activeAssessments = assessments.filter(a => a.activo);
    if (activeAssessments.length === 0) {
      showToast.error("No hay assessments activos.");
      return;
    }
    const payloads = getBulkAdminPayloads(activeAssessments, admins);
    const items: MassActionItem[] = payloads.map((item) => ({
      key: `${item.assessment.id}-${item.correo}`,
      title: item.correo,
      subtitle: item.assessment.nombre,
      status: item.exists ? "omitir" : "crear",
    }));
    
    setMassAction({
      title: "Crear admins para assessments activos",
      description: "Se omitirán los admins ya existentes.",
      items,
      onConfirm: () => {
        setMassAction(null);
        handleCreateAdminsForAllAssessments(payloads);
      },
    });
  };

  // Individual Updates
  const handleUpdateAssessment = async (assessmentId: number) => {
    const edit = assessmentEdits[assessmentId];
    if (!edit) return;
    setLoading(true);
    try {
      const response = await authFetch(
        "/api/assessment/update",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: assessmentId,
            descripcion: edit.descripcion,
            activo: edit.activo,
            grupoId: edit.grupoId ? Number(edit.grupoId) : null,
          }),
        },
        () => logout()
      );
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Error al actualizar assessment");
      }
      showToast.success("Assessment actualizado");
      setAssessments(prev => prev.map(a => a.id === assessmentId ? { 
        ...a, 
        descripcion: edit.descripcion, 
        activo: edit.activo,
        grupoId: edit.grupoId ? Number(edit.grupoId) : null,
        grupoNombre: gruposEstudiantiles.find(g => g.id === Number(edit.grupoId))?.nombre || null
      } : a));
    } catch (error: any) {
      showToast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdmin = async (adminId: number) => {
    const edit = adminEdits[adminId];
    if (!edit) return;
    setLoading(true);
    try {
      const response = await authFetch(
        "/api/staff/update",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: adminId,
            correo: edit.correo,
            password: edit.password || undefined,
          }),
        },
        () => logout()
      );
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Error al actualizar admin");
      }
      showToast.success("Admin actualizado");
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, correo: edit.correo } : a));
    } catch (error: any) {
      showToast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    massAction,
    setMassAction,
    openBulkAssessmentPreview,
    openBulkAdminPreview,
    handleUpdateAssessment,
    handleUpdateAdmin
  };
}
