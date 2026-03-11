import React from 'react';
import { type Calificacion } from '../schemas/configSchemas';

interface EditParticipantModalProps {
  editModal: Calificacion;
  setEditModal: (val: Calificacion | null) => void;
  onCancel: () => void;
  onUpdate: (e: React.FormEvent) => void;
}

export const EditParticipantModal: React.FC<EditParticipantModalProps> = ({
  editModal,
  setEditModal,
  onCancel,
  onUpdate,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-[#1e1e1e] rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <h2 id="modal-title" className="text-lg sm:text-xl font-bold mb-4 text-white">Editar Participante</h2>
        <form onSubmit={onUpdate}>
          <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Nombre</label>
          <input
            type="text"
            value={editModal.Participante}
            onChange={(e) => setEditModal({ ...editModal, Participante: e.target.value })}
            className="w-full border border-gray-600 px-3 py-2 rounded mb-4 text-white bg-[#2d2d2d] placeholder-gray-500 text-sm sm:text-base focus:border-[color:var(--color-accent)] focus:outline-none"
          />

          <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Correo</label>
          <input
            type="email"
            value={editModal.Correo}
            onChange={(e) => setEditModal({ ...editModal, Correo: e.target.value })}
            className="w-full border border-gray-600 px-3 py-2 rounded mb-4 text-white bg-[#2d2d2d] placeholder-gray-500 text-sm sm:text-base focus:border-[color:var(--color-accent)] focus:outline-none"
          />

          <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Rol</label>
          <input
            type="text"
            value={editModal.role}
            onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
            className="w-full border border-gray-600 px-3 py-2 rounded mb-4 text-white bg-[#2d2d2d] placeholder-gray-500 text-sm sm:text-base focus:border-[color:var(--color-accent)] focus:outline-none"
          />

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 sm:px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500 text-sm sm:text-base transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 sm:px-4 py-2 rounded bg-success text-white hover:bg-success-dark text-sm sm:text-base transition"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
