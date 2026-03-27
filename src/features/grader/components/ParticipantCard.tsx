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

      <div className="flex items-center justify-center gap-4 mb-4">
        <p className="text-base font-bold text-gray-800 leading-tight max-w-[140px]">
          {usuario.Nombre.toUpperCase()}
        </p>
        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border flex items-center justify-center">
          {usuario.Photo?.trim() ? (
            <img
              src={usuario.Photo}
              alt={usuario.Nombre}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => onPhotoClick(usuario.Photo!)}
            />
          ) : (
            <span className="text-xl font-bold text-[color:var(--color-accent)]">{getInitials(usuario.Nombre)}</span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {[1, 2, 3].map((num) => (
          <div key={num}>
            <p className="text-lg text-center font-semibold text-[color:var(--color-accent)]">Comportamiento {num}</p>
            <p className="text-xs text-gray-700 mb-1 text-center">
              {baseData?.[`Comportamiento${num}` as keyof BaseData] as string}
            </p>
            <input
              type="number"
              min={1} max={5}
              className={`w-full rounded-xl px-2 py-1 text-center font-bold text-lg text-gray-800 border focus:ring-1 focus:ring-[color:var(--color-accent)] ${
                errores.includes(usuario.ID) ? 'border-yellow-400' : 'border-gray-300'
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