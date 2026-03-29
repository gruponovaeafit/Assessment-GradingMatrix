import React, { useRef, useState, useMemo } from 'react';
import { Participant, CalificacionesType, BaseData } from '../schemas/graderSchemas';
import { ParticipantCard } from './ParticipantCard';

interface GraderCarouselProps {
  participantes: Participant[];
  baseData: BaseData | null;
  calificaciones: CalificacionesType;
  errores: number[];
  carouselIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onInputChange: (id: number, num: number, value: string) => void;
  submitting: boolean;
  alreadyGraded: boolean;
  onSubmit: () => void;
}

export const GraderCarousel: React.FC<GraderCarouselProps> = (props) => {
  const { participantes, carouselIndex, onPrev, onNext } = props;

  // Estados Locales
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const touchStartX = useRef<number>(0);

  const SWIPE_THRESHOLD = 80;
  const DRAG_CLAMP = 120;

  // Cálculos de Índice y Layout
  const currentIndex = useMemo(() => {
    if (participantes.length === 0) return 0;
    return (carouselIndex % participantes.length + participantes.length) % participantes.length;
  }, [carouselIndex, participantes.length]);

  if (participantes.length === 0) return null;

  const cardWidthPercent = 100 / participantes.length;
  const stripTranslate = `calc(-${currentIndex * cardWidthPercent}% + ${dragOffset}px)`;

  // Handlers de Touch
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const diff = e.targetTouches[0].clientX - touchStartX.current;
    setDragOffset(Math.max(-DRAG_CLAMP, Math.min(DRAG_CLAMP, diff)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (Math.abs(dragOffset) >= SWIPE_THRESHOLD) {
      if (dragOffset > 0) {
        onPrev();
      } else {
        onNext();
      }
      setShowTip(false);
    }
    setDragOffset(0);
  };

  return (
    <>
      <div className="flex items-center gap-2 w-full">
        {/* Botón Prev */}
        <NavButton direction="prev" onClick={onPrev} />

        {/* Carousel Container */}
        <div
          className="flex-1 min-w-0 overflow-hidden rounded-lg border border-gray-200 shadow-2xl bg-white touch-pan-y select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex pt-1 pb-1 min-h-[400px] sm:min-h-[500px]"
            style={{
              width: `${participantes.length * 100}%`,
              transform: `translateX(${stripTranslate})`,
              transition: isDragging ? 'none' : 'transform 0.25s ease-out',
            }}
          >
            {participantes.map((usuario, idx) => (
              <ParticipantCard
                key={usuario.ID}
                usuario={usuario}
                idx={idx}
                currentIndex={currentIndex}
                cardWidthPercent={cardWidthPercent}
                showTip={showTip}
                onPhotoClick={setPhotoPreview}
                {...props}
              />
            ))}
          </div>
        </div>

        {/* Botón Next */}
        <NavButton direction="next" onClick={onNext} />
      </div>

      {/* Modal de Foto */}
      {photoPreview && <PhotoModal url={photoPreview} onClose={() => setPhotoPreview(null)} />}
    </>
  );
};

// Pequeños componentes de soporte internos para evitar repetición
const NavButton = ({ direction, onClick }: { direction: 'prev' | 'next', onClick: () => void }) => {
  const isNext = direction === 'next';

  return (
    <div className="hidden md:flex items-center gap-3">

      {/* Si es prev → texto primero */}
      {!isNext && (
        <span className="text-sm text-center text-gray-400 leading-tight">
          Participante <br/>
          anterior
        </span>
      )}

      <button
        type="button"
        onClick={onClick}
        className="p-3 rounded-full bg-[color:var(--color-accent)] text-white hover:brightness-90 transition shrink-0"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {direction === 'prev'
            ? <path d="M15 19l-7-7 7-7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M9 5l7 7-7 7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>}
        </svg>
      </button>

      {/* Si es next → texto después */}
      {isNext && (
        <span className="text-sm text-center text-gray-400 leading-tight">
          Siguiente <br/>
          participante
        </span>
      )}
    </div>
  );
};

const PhotoModal = ({ url, onClose }: { url: string, onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
    <div className="relative" onClick={e => e.stopPropagation()}>
      <img src={url} alt="Preview" className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-lg" />
      <button className="absolute top-2 right-2 bg-white rounded-full p-2" onClick={onClose}>
        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </button>
    </div>
  </div>
);