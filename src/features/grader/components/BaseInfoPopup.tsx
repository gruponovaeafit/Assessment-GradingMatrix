import React from 'react';
import { type BaseData } from '../schemas/graderSchemas';

interface BaseInfoPopupProps {
  show: boolean;
  onClose: () => void;
  baseData: BaseData | null;
}

export const BaseInfoPopup: React.FC<BaseInfoPopupProps> = ({ show, onClose, baseData }) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="base-info-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border-2 border-[color:var(--color-accent)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="base-info-title" className="text-lg font-bold text-gray-900 mb-2">
          {baseData?.Nombre ?? 'Base'}
        </h2>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {baseData?.Descripcion ?? 'No hay descripción disponible.'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full py-2 rounded-lg bg-[color:var(--color-accent)] text-white font-semibold hover:bg-[#5B21B6] transition"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
