import React from 'react';
import { Spinner } from '@/components/UI/Loading';
import { type Base } from '../schemas/basesSchemas';

interface BasesListProps {
  bases: Base[];
  loading: boolean;
  onOpenEdit: (base: Base) => void;
  onDelete: (baseId: number) => void;
}

export const BasesList: React.FC<BasesListProps> = ({
  bases,
  loading,
  onOpenEdit,
  onDelete,
}) => {
  return (
    <div className="w-full max-w-[1200px] px-1 sm:px-2">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" color="custom" customColor="var(--color-accent)" />
          <span className="ml-3 text-gray-600">Cargando bases...</span>
        </div>
      ) : bases.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay bases registradas para este assessment</p>
          <p className="text-sm mt-2">Haz clic en &quot;Crear Nueva Base&quot; para agregar una</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bases.map((base) => (
            <div
              key={base.ID_Base}
              className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block bg-[color:var(--color-accent)] text-white text-xs font-bold px-2 py-1 rounded">
                    Base #{base.Numero_Base}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-2">
                    {base.Nombre_Base}
                  </h3>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Competencia:</span> {base.Competencia_Base}
                </p>
                <p>
                  <span className="font-semibold">Descripción:</span> {base.Descripcion_Base}
                </p>
                <div className="border-t border-gray-200 pt-2 mt-3">
                  <p className="font-semibold text-gray-900 mb-1">Comportamientos:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>{base.Comportamiento1_Base}</li>
                    <li>{base.Comportamiento2_Base}</li>
                    <li>{base.Comportamiento3_Base}</li>
                  </ol>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => onOpenEdit(base)}
                  className="flex-1 bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(base.ID_Base)}
                  className="flex-1 bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
