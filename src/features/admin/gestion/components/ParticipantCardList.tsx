import React from 'react';
import { type ParticipantDashboardRow } from '../schemas/gestionSchemas';

interface ParticipantCardListProps {
  paginatedData: ParticipantDashboardRow[];
  getEstadoInfo: (promedio: number | null) => { texto: string; color: string };
  onEdit: (participant: ParticipantDashboardRow) => void;
  onDetail: (participant: ParticipantDashboardRow) => void;
}

export const ParticipantCardList: React.FC<ParticipantCardListProps> = ({
  paginatedData,
  getEstadoInfo,
  onEdit,
  onDetail,
}) => {
  return (
    <div className="lg:hidden w-full max-w-md space-y-4">
      {paginatedData.map((item) => {
        const status = getEstadoInfo(item.Calificacion_Promedio);
        return (
          <div key={item.ID} className="bg-white shadow rounded-xl p-4 border border-gray-100 animate-fadeIn">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200">
                {item.Foto ? (
                  <img src={item.Foto} alt={item.Participante} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl">👤</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{item.Participante}</p>
                <p className="text-xs text-gray-500 truncate">{item.Correo}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                  item.role === '1' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                }`}>
                  {item.role === '1' ? 'Infiltrado' : 'Aspirante'}
                </span>
                <span className="text-xs font-bold text-gray-400">{item.Grupo}</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-gray-50 mb-3">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Promedio</p>
                <p className="text-sm font-black text-gray-900">
                  {item.Calificacion_Promedio != null ? item.Calificacion_Promedio.toFixed(2) : "-"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Estado</p>
                <p className={`text-xs font-bold ${status.color}`}>{status.texto}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onDetail(item)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
              >
                👁️ Ver Detalle
              </button>
              <button
                onClick={() => onEdit(item)}
                className="flex-1 bg-gray-50 hover:bg-gray-100 text-[color:var(--color-accent)] py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
              >
                ✏️ Editar
              </button>
            </div>
          </div>
        );
      })}
      {paginatedData.length === 0 && (
        <div className="p-10 text-center text-gray-400 italic">No hay registros que coincidan.</div>
      )}
    </div>
  );
};
