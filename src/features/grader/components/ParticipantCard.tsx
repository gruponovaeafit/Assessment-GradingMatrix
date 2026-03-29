import React from 'react';
import { Participant, BaseData, CalificacionesType, CalificacionKey } from '../schemas/graderSchemas';
import { getInitials } from '../utils/graderUtils';

interface ParticipantCardProps {
  usuario: Participant;
  idx: number;
  currentIndex: number;
  baseData: BaseData | null;
  calificaciones: CalificacionesType;
  errores: number[];
  submitting: boolean;
  alreadyGraded: boolean;
  showTip: boolean;
  cardWidthPercent: number;
  onInputChange: (id: number, num: number, value: string) => void;
  onSubmit: () => void;
  onPhotoClick: (url: string) => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  usuario, idx, currentIndex, baseData, calificaciones, errores,
  submitting, alreadyGraded, showTip, cardWidthPercent,
  onInputChange, onSubmit, onPhotoClick
}) => {
  return (
    <div
      className="flex-shrink-0 p-4 min-w-0 relative"
      style={{ flexBasis: `${cardWidthPercent}%` }}
    >
      {showTip && idx === currentIndex && (
        <div className="md:hidden w-full flex justify-center mb-3">
          <span className="flex items-center gap-2 bg-black/70 text-white text-xs font-medium rounded-full px-3 py-0.5 shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M16 8l4 4-4 4" />
            </svg>
            Desliza para cambiar
          </span>
        </div>
      )}

      <div className="flex items-center justify-center gap-6 mb-6">
        <p className="text-base sm:text-xl lg:text-2xl font-bold text-gray-800 leading-tight max-w-[150px] sm:max-w-xs">
          {usuario.Nombre.toUpperCase()}
        </p>
        <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden bg-gray-100 border-2 border-[color:var(--color-accent)] flex items-center justify-center shadow-lg transition-transform hover:scale-105">
          {usuario.Photo?.trim() ? (
            <img
              src={usuario.Photo}
              alt={usuario.Nombre}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => onPhotoClick(usuario.Photo!)}
            />
          ) : (
            <span className="text-xl sm:text-3xl font-bold text-[color:var(--color-accent)]">{getInitials(usuario.Nombre)}</span>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((num) => (
          <div key={num} className="bg-gray-50/50 p-2 rounded-xl border border-transparent hover:border-gray-200 transition-colors">
            <p className="text-lg sm:text-xl font-semibold text-[color:var(--color-accent)] text-center">Comportamiento {num}</p>
            <p className="text-xs sm:text-sm text-gray-700 mb-2 text-center px-4">
              {baseData?.[`Comportamiento${num}` as keyof BaseData] as string}
            </p>
            <input
              type="number"
              min={1} max={5}
              className={`w-full rounded-xl px-4 py-2 sm:py-3 text-center font-bold text-xl sm:text-2xl text-gray-800 border shadow-sm transition-all focus:ring-2 focus:ring-[color:var(--color-accent)] focus:border-transparent outline-none ${
                errores.includes(usuario.ID) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'
              }`}
              value={calificaciones[usuario.ID]?.[`Calificacion_${num}` as CalificacionKey] ?? ''}
              onChange={(e) => onInputChange(usuario.ID, num, e.target.value)}
              disabled={submitting || alreadyGraded}
            />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={onSubmit}
          disabled={submitting || alreadyGraded}
          className="w-full bg-[color:var(--color-accent)] text-white font-bold py-3 rounded-lg shadow hover:bg-[#5B21B6] transition disabled:opacity-60"
        >
          {submitting ? 'Enviando...' : alreadyGraded ? 'Ya calificado' : 'Enviar calificaciones'}
        </button>
      </div>
    </div>
  );
};