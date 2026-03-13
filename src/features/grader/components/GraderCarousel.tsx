import React, { useRef, useState } from 'react';
import { 
  type Participant, 
  type CalificacionesType, 
  type CalificacionKey,
  type BaseData
} from '../schemas/graderSchemas';
import { getInitials } from '../utils/graderUtils';

interface GraderCarouselProps {
  participantes: Participant[];
  baseData: BaseData | null;
  calificaciones: CalificacionesType;
  errores: number[];
  carouselIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onInputChange: (id: number, num: number, value: string) => void;
  onShowBaseInfo: () => void;
  submitting: boolean;
  alreadyGraded: boolean;
}

export const GraderCarousel: React.FC<GraderCarouselProps> = ({
  participantes,
  baseData,
  calificaciones,
  errores,
  carouselIndex,
  onPrev,
  onNext,
  onInputChange,
  onShowBaseInfo,
  submitting,
  alreadyGraded
}) => {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef<number>(0);
  
  const SWIPE_THRESHOLD = 80;
  const DRAG_CLAMP = 120;

  const hasParticipants = participantes.length > 0;
  const currentIndex = hasParticipants 
    ? (carouselIndex % participantes.length + participantes.length) % participantes.length 
    : 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStartX.current;
    const clamped = Math.max(-DRAG_CLAMP, Math.min(DRAG_CLAMP, diff));
    setDragOffset(clamped);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) >= SWIPE_THRESHOLD) {
      if (dragOffset > 0) onPrev();
      else onNext();
    }
    setDragOffset(0);
  };

  if (!hasParticipants) return null;

  const cardWidthPercent = 100 / participantes.length;
  const stripTranslate = `calc(-${currentIndex * cardWidthPercent}% + ${dragOffset}px)`;

  return (
    <>
      <div className="flex items-center gap-2 w-full">
        <button
          type="button"
          onClick={onPrev}
          className="hidden md:flex p-3 rounded-full bg-[color:var(--color-accent)] text-white hover:bg-[#5B21B6] transition shrink-0"
          aria-label="Anterior"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div
          className="flex-1 min-w-0 overflow-hidden rounded-2xl border-2 border-gray-200 shadow-lg bg-white touch-pan-y select-none md:select-auto"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex px-2 py-4 min-h-[200px]"
            style={{
              width: `${participantes.length * 100}%`,
              transform: `translateX(${stripTranslate})`,
              transition: isDragging ? 'none' : 'transform 0.25s ease-out',
            }}
          >
            {participantes.map((usuario, idx) => (
              <div
                key={usuario.ID}
                className="flex-shrink-0 px-1 min-w-0 relative"
                style={{ flexBasis: `${cardWidthPercent}%` }}
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onShowBaseInfo(); }}
                  className="absolute top-0 right-2 z-10 w-7 h-7 rounded-full bg-[color:var(--color-accent)] text-white flex items-center justify-center text-sm font-bold shadow hover:bg-[#5B21B6] transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[color:var(--color-accent)]"
                  aria-label="Ver información de la base"
                >
                  ?
                </button>
                <div className="flex flex-col items-center gap-2 mb-4">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 border-2 border-[color:var(--color-accent)] flex items-center justify-center">
                    {(typeof usuario.Photo === 'string' && usuario.Photo.trim()) ? (
                      <img
                        src={usuario.Photo}
                        alt={`Foto de ${usuario.Nombre}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = 'none';
                          const p = t.parentElement;
                          if (p) p.innerHTML = `<span class="text-xl font-bold text-[color:var(--color-accent)]">${getInitials(usuario.Nombre)}</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-xl font-bold text-[color:var(--color-accent)]">{getInitials(usuario.Nombre)}</span>
                    )}
                  </div>
                  <p className="text-base font-bold text-gray-900 truncate max-w-full text-center">{usuario.Nombre}</p>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map((num) => {
                    const comportamiento = baseData?.[`Comportamiento${num}` as keyof typeof baseData] as string;
                    return (
                      <div key={num}>
                        <p className="text-xs font-semibold text-[color:var(--color-accent)]">Comportamiento {num}</p>
                        <p className="text-xs text-gray-500 mb-1">{comportamiento}</p>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          step={1}
                          className={`w-full rounded-lg px-3 py-2 text-gray-900 text-center font-bold text-lg bg-white border-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] ${errores.includes(usuario.ID) ? 'border-yellow-400' : 'border-[color:var(--color-accent)]'}`}
                          value={calificaciones[usuario.ID]?.[`Calificacion_${num}` as CalificacionKey] ?? ''}
                          onChange={(e) => onInputChange(usuario.ID, num, e.target.value)}
                          disabled={submitting || alreadyGraded}
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                  {idx + 1} / {participantes.length}
                </p>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="hidden md:flex p-3 rounded-full bg-[color:var(--color-accent)] text-white hover:bg-[#5B21B6] transition shrink-0"
          aria-label="Siguiente"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <p className="text-center text-xs text-gray-400 mt-2 md:hidden">Desliza para cambiar de participante</p>
    </>
  );
};
