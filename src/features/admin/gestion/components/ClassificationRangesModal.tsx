import React, { useState } from 'react';
import { type ClassificationRanges } from '../schemas/gestionSchemas';

interface ClassificationRangesModalProps {
  classificationRanges: ClassificationRanges;
  onSave: (ranges: ClassificationRanges) => void;
  onClose: () => void;
}

export const ClassificationRangesModal: React.FC<ClassificationRangesModalProps> = ({
  classificationRanges,
  onSave,
  onClose,
}) => {
  const [ranges, setRanges] = useState<ClassificationRanges>({ ...classificationRanges });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(ranges);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="ranges-modal-title">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
        <div className="bg-gray-800 text-white px-6 py-4">
          <h2 id="ranges-modal-title" className="text-lg font-bold">Configurar Rangos de Clasificación</h2>
          <p className="text-xs text-gray-400">Define los umbrales de promedio para cada estado.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">✅ Pasa al Grupo (Mínimo)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={ranges.group}
              onChange={(e) => setRanges({ ...ranges, group: Number(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-success outline-none transition text-gray-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">📋 Entrevista (Mínimo)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={ranges.interview}
              onChange={(e) => setRanges({ ...ranges, interview: Number(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-success-light outline-none transition text-gray-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">⚠️ Discusión (Mínimo)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={ranges.discussion}
              onChange={(e) => setRanges({ ...ranges, discussion: Number(e.target.value) })}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-yellow-400 outline-none transition text-gray-900"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white font-bold hover:bg-black transition text-sm"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
