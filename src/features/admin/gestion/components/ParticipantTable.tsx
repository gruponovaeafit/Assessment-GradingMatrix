import React from 'react';
import { Spinner } from '@/components/UI/Loading';
import { Eye, Pencil, User } from 'lucide-react';
import { type ParticipantDashboardRow } from '../schemas/gestionSchemas';

interface ParticipantTableProps {
  paginatedData: ParticipantDashboardRow[];
  baseNumbers: number[];
  getEstadoInfo: (promedio: number | null) => { texto: string; color: string; Icon: React.ElementType };
  onEdit: (participant: ParticipantDashboardRow) => void;
  onDetail: (participant: ParticipantDashboardRow) => void;
}

export const ParticipantTable: React.FC<ParticipantTableProps> = ({
  paginatedData,
  baseNumbers,
  getEstadoInfo,
  onEdit,
  onDetail,
}) => {
  return (
    <div className="hidden lg:block w-full max-w-7xl bg-white shadow rounded-xl overflow-hidden border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Participante</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rol</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Grupo</th>
              {baseNumbers.map((n) => (
                <th key={n} className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                  Base {n}
                </th>
              ))}
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">Promedio</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.map((item) => {
              const { texto, color, Icon } = getEstadoInfo(item.Calificacion_Promedio);
              return (
                <tr key={item.ID} className="hover:bg-gray-50/50 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden border border-gray-200">
                        {item.Foto ? (
                          <img src={item.Foto} alt={item.Participante} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.Participante}</p>
                        <p className="text-xs text-gray-600">{item.Correo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      item.role === '1' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
                    }`}>
                      {item.role === '1' ? 'Infiltrado' : 'Aspirante'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-800 font-medium">{item.Grupo}</td>
                  {baseNumbers.map((n) => {
                    const base = item.Bases.find((b) => b.numero === n);
                    return (
                      <td key={n} className="p-4 text-center text-gray-900 text-sm font-mono">
                        {base && base.promedio != null ? base.promedio.toFixed(2) : <span className="text-gray-300">-</span>}
                      </td>
                    );
                  })}
                  <td className="p-4 text-center">
                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      {item.Calificacion_Promedio != null ? item.Calificacion_Promedio.toFixed(2) : "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs font-bold flex items-center ${color}`}>
                      <Icon className="inline-block w-4 h-4 mr-1.5" />
                      {texto}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onDetail(item)}
                        className="p-2 bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white rounded-lg shadow-sm transition group"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4 transition-transform group-hover:scale-110" />
                      </button>
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition group"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4 transition-transform group-hover:scale-110" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {paginatedData.length === 0 && (
          <div className="p-10 text-center text-gray-400 italic">No se encontraron registros.</div>
        )}
      </div>
    </div>
  );
};
