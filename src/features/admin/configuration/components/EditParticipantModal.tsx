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
      <div className="bg-white rounded-2xl p-6 sm:p-8 w-full max-w-md max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl">
        <h2 id="modal-title" className="text-2xl font-bold mb-6 text-gray-900">Editar Staff</h2>
        <form onSubmit={onUpdate} className="space-y-4">
          <div>
            <label className="block mb-1.5 font-semibold text-gray-700 text-sm">Correo</label>
            <input
              type="email"
              value={editModal.Correo}
              onChange={(e) => setEditModal({ ...editModal, Correo: e.target.value })}
              className="w-full border border-gray-200 px-4 py-3 rounded-xl text-gray-900 bg-gray-50 placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-200 focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block mb-1.5 font-semibold text-gray-700 text-sm">Rol</label>
            <select
              value={editModal.role}
              onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
              className="w-full border border-gray-200 px-4 py-3 rounded-xl text-gray-900 bg-gray-50 text-sm focus:ring-2 focus:ring-purple-200 focus:outline-none transition"
            >
              <option value="admin">Administrador</option>
              <option value="calificador">Calificador</option>
              <option value="registrador">Registrador</option>
            </select>
          </div>

          <div className="flex items-center gap-3 py-2">
            <label className="font-semibold text-gray-700 text-sm">Estado Activo</label>
            <button
              type="button"
              onClick={() => setEditModal({ ...editModal, Active: !editModal.Active })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                editModal.Active ? 'bg-success' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  editModal.Active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold text-sm transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl bg-[color:var(--color-accent)] text-white hover:bg-[#5B21B6] font-semibold text-sm transition shadow-lg shadow-purple-200"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
