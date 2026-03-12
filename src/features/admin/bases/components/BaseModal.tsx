import React from 'react';
import { type Base, type BaseFormData } from '../schemas/basesSchemas';

interface BaseModalProps {
  showModal: boolean;
  editingBase: Base | null;
  formData: BaseFormData;
  setFormData: React.Dispatch<React.SetStateAction<BaseFormData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  showModal,
  editingBase,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-900">
          {editingBase ? 'Editar Base' : 'Crear Nueva Base'}
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          {!editingBase && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-1">
                Número de Base *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.numeroBase}
                onChange={(e) => setFormData({ ...formData, numeroBase: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300"
                placeholder="Ej: 1"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Nombre de la Base *
            </label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300"
              placeholder="Ej: Liderazgo Transformacional"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Competencia *
            </label>
            <input
              type="text"
              required
              value={formData.competencia}
              onChange={(e) => setFormData({ ...formData, competencia: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300"
              placeholder="Ej: Liderazgo"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-1">
              Descripción *
            </label>
            <textarea
              required
              rows={3}
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300"
              placeholder="Describe la competencia a evaluar"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">Comportamientos *</p>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Comportamiento 1</label>
              <textarea
                required
                rows={2}
                value={formData.comportamiento1}
                onChange={(e) => setFormData({ ...formData, comportamiento1: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Comportamiento 2</label>
              <textarea
                required
                rows={2}
                value={formData.comportamiento2}
                onChange={(e) => setFormData({ ...formData, comportamiento2: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Comportamiento 3</label>
              <textarea
                required
                rows={2}
                value={formData.comportamiento3}
                onChange={(e) => setFormData({ ...formData, comportamiento3: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white transition"
            >
              {editingBase ? 'Guardar Cambios' : 'Crear Base'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
