import React from 'react';

interface AutoGroupFormProps {
  autoGroupCount: string;
  setAutoGroupCount: (val: string) => void;
  autoGrouping: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const AutoGroupForm: React.FC<AutoGroupFormProps> = ({
  autoGroupCount,
  setAutoGroupCount,
  autoGrouping,
  onSubmit,
}) => {
  return (
    <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
      <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Crear y Sortear Grupos</h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="number"
            min={1}
            placeholder="Cantidad de grupos"
            value={autoGroupCount}
            onChange={(e) => setAutoGroupCount(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
          />
          <div className="sm:col-span-1 sm:flex sm:items-center sm:justify-end">
            <button
              type="submit"
              disabled={autoGrouping}
              className="w-full px-4 py-2 rounded-lg bg-success hover:bg-success-dark text-white text-sm font-medium transition disabled:opacity-60"
            >
              {autoGrouping ? 'Sorteando...' : 'Crear y sortear'}
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Distribuye participantes de forma equitativa. Si hay impostores (rol=1), se reparte 1 por grupo hasta que se acaben.
        </p>
      </div>
    </div>
  );
};
