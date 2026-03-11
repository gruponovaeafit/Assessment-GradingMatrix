import React from 'react';
import { type ParticipantDashboardRow } from '../schemas/gestionSchemas';

const FOTO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle fill='%23e5e7eb' cx='32' cy='32' r='32'/%3E%3Ccircle fill='%239ca3af' cx='32' cy='26' r='10'/%3E%3Cellipse fill='%239ca3af' cx='32' cy='56' rx='18' ry='14'/%3E%3C/svg%3E";

interface ParticipantDetailModalProps {
  detailModal: ParticipantDashboardRow;
  onClose: () => void;
  getEstadoInfo: (promedio: number | null) => { texto: string; color: string };
}

export const ParticipantDetailModal: React.FC<ParticipantDetailModalProps> = ({
  detailModal,
  onClose,
  getEstadoInfo,
}) => {
  const status = getEstadoInfo(detailModal.Calificacion_Promedio);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-2 border-[color:var(--color-accent)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[color:var(--color-accent)] text-white px-4 py-3 flex justify-between items-center rounded-t-2xl">
          <h2 id="detail-modal-title" className="text-lg font-bold">Detalle del participante</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 text-2xl leading-none transition"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
            <img
              src={detailModal.Foto && detailModal.Foto.trim() !== "" ? detailModal.Foto : FOTO_PLACEHOLDER}
              alt={detailModal.Participante}
              className="w-44 h-44 sm:w-52 sm:h-52 rounded-full object-cover border-4 border-[color:var(--color-accent)] shadow-lg shrink-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== FOTO_PLACEHOLDER) target.src = FOTO_PLACEHOLDER;
              }}
            />
            <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
              <h3 className="text-xl font-bold text-gray-900 truncate">{detailModal.Participante}</h3>
              <p className="text-gray-600 text-sm truncate">{detailModal.Correo}</p>
              <dl className="grid grid-cols-2 gap-3 text-gray-900 text-left">
                <div>
                  <dt className="text-[10px] font-semibold text-gray-500 uppercase">Rol</dt>
                  <dd className="text-sm font-medium">
                    {detailModal.role === "1" ? "Infiltrado" : "Aspirante"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold text-gray-500 uppercase">Grupo</dt>
                  <dd className="text-sm font-medium">{detailModal.Grupo}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold text-gray-500 uppercase">Promedio</dt>
                  <dd className="text-sm font-black">
                    {detailModal.Calificacion_Promedio != null
                      ? detailModal.Calificacion_Promedio.toFixed(2)
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold text-gray-500 uppercase">Estado</dt>
                  <dd>
                    <span className={`text-xs font-bold ${status.color}`}>
                      {status.texto}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Calificaciones por base</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {detailModal.Bases.map((b) => (
                <div key={b.numero} className="bg-gray-50 rounded-xl p-2 text-center border border-gray-100">
                  <span className="text-[10px] text-gray-400 block font-bold">BASE {b.numero}</span>
                  <span className="text-sm font-black text-gray-900">
                    {b.promedio != null ? b.promedio.toFixed(2) : "-"}
                  </span>
                </div>
              ))}
              {detailModal.Bases.length === 0 && (
                <p className="col-span-full text-center text-xs text-gray-400 italic">No hay bases registradas.</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
