import { useState } from "react";
import { authFetch } from "@/lib/auth/authFetch";
import { showToast } from "@/components/UI/Toast";
import { type ParticipantDashboardRow } from "../schemas/gestionSchemas";

export function useGestionActions(
  logout: () => void,
  setData: React.Dispatch<React.SetStateAction<ParticipantDashboardRow[]>>
) {
  const [editModal, setEditModal] = useState<ParticipantDashboardRow | null>(null);
  const [originalData, setOriginalData] = useState<ParticipantDashboardRow | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || !originalData) return;

    const updates: Record<string, string | number> = { id: editModal.ID };
    if (editModal.Participante !== originalData.Participante) updates.nombre = editModal.Participante;
    if (editModal.Correo !== originalData.Correo) updates.correo = editModal.Correo;
    if (editModal.role !== originalData.role) updates.role = editModal.role;

    if (Object.keys(updates).length === 1) {
      showToast.error("Debe modificarse al menos un campo");
      return;
    }

    try {
      const res = await authFetch("/api/update-person", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }, () => logout());

      const result = await res.json();
      if (res.ok) {
        showToast.success("Participante actualizado correctamente");
        setData((prev) => prev.map((p) => (p.ID === editModal.ID ? { ...p, ...editModal } : p)));
        setEditModal(null);
        setOriginalData(null);
      } else {
        showToast.error(result.error || "Error al actualizar");
      }
    } catch (err) {
      showToast.error("Error de conexión al actualizar");
    }
  };

  const openEditModal = (p: ParticipantDashboardRow) => {
    setEditModal({ ...p });
    setOriginalData({ ...p });
  };

  const closeEditModal = () => {
    setEditModal(null);
    setOriginalData(null);
  };

  return {
    editModal,
    setEditModal,
    handleUpdate,
    openEditModal,
    closeEditModal
  };
}
