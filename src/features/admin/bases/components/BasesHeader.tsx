import React from 'react';

interface BasesHeaderProps {
  onBack: () => void;
  onLogout: () => void;
}

export const BasesHeader: React.FC<BasesHeaderProps> = ({ onBack, onLogout }) => {
  return (
    <div className="w-full max-w-[1200px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 px-1 sm:px-2">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Gestión de Bases</h1>
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
        <button
          onClick={onBack}
          className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Volver a Config
        </button>
        <button
          onClick={onLogout}
          className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};
