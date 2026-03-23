import React from 'react';

interface SuccessModalProps {
  successId: number | null;
  onDismiss: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ successId, onDismiss }) => {
  if (successId === null) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onDismiss}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border-2 border-green-500"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</p>
          <p className="text-gray-600 mb-1">La persona fue registrada correctamente.</p>
          <p className="text-lg font-semibold text-purple-600 mt-3">
            ID asignado: <span className="font-bold">{successId}</span>
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="mt-6 w-full rounded-lg bg-purple-600 text-white py-3 font-semibold hover:bg-purple-700 transition"
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );
};