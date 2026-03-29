import { useState } from "react";
import { authFetch } from "@/lib/auth/authFetch";
import { notify } from "@/components/UI/Notification";
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
      notify({ 
        title: "Error", 
        subtitle: "Debe modificarse al menos un campo", 
        titleColor: "#ef4444", 
        borderColor: "#ef4444" 
      });
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
        notify({ 
          title: "¡Éxito!", 
          subtitle: "Participante actualizado correctamente", 
          titleColor: "#22c55e", 
          borderColor: "#22c55e" 
        });
        setData((prev) => prev.map((p) => (p.ID === editModal.ID ? { ...p, ...editModal } : p)));
        setEditModal(null);
        setOriginalData(null);
      } else {
        notify({ 
          title: "Error", 
          subtitle: result.error || "Error al actualizar", 
          titleColor: "#ef4444", 
          borderColor: "#ef4444" 
        });
      }
    } catch (err) {
      notify({ 
        title: "Error", 
        subtitle: "Error de conexión al actualizar", 
        titleColor: "#ef4444", 
        borderColor: "#ef4444" 
      });
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
