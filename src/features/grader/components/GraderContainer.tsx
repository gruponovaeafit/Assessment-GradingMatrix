'use client';

import React, { useState } from 'react';
import { useGraderAuth } from "@/hooks/useGraderAuth";
import { Spinner, SkeletonBaseInfo, SkeletonUserCard } from '@/components/UI/Loading';
import { useConfirmModal } from '@/components/UI/ConfirmModal';

// Feature components & hooks
import { useGraderData } from '../hooks/useGraderData';
import { useGraderActions } from '../hooks/useGraderActions';
import { BaseInfoPopup } from './BaseInfoPopup';
import { GraderCarousel } from './GraderCarousel';

export const GraderContainer: React.FC = () => {
  const { isGrader, isLoading: authLoading } = useGraderAuth();
  const { confirm, setIsLoading, ConfirmModalComponent } = useConfirmModal();
  const [showBaseInfoPopup, setShowBaseInfoPopup] = useState(false);

  // Data & Actions Hooks
  const data = useGraderData();
  const actions = useGraderActions(
    data.usuarios,
    data.selectedGroupId,
    data.alreadyGraded,
    data.setAlreadyGraded,
    data.groups,
    data.setGroups,
    data.setSelectedGroupId,
    data.setUsuarios,
    confirm,
    setIsLoading
  );

  const isInitialLoading = data.loading || authLoading;
  const hasParticipants = actions.participantesToGrade.length > 0;

  // --- Handlers ---
  const handleExit = () => {
    confirm({
      title: '¿Salir de la sesión?',
      message: 'Si sales, perderás cualquier cambio no guardado.',
      confirmText: 'Salir',
      cancelText: 'Cancelar',
      variant: 'danger',
    }).then((confirmed) => {
      if (confirmed) window.location.href = '/';
    });
  };

  // --- Sub-renderizados para limpiar el return principal ---

  const renderLoadingState = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Spinner size="lg" color="primary-light" />
        <span className="text-gray-500 text-xl font-medium">Cargando datos...</span>
      </div>
      <SkeletonBaseInfo />
      <div className="flex flex-col items-center gap-6 w-full">
        {[1, 2].map((i) => <SkeletonUserCard key={i} />)}
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className="flex items-center gap-2 mb-4">
      <select
        value={data.selectedGroupId}
        onChange={(e) => data.setSelectedGroupId(e.target.value)}
        className="flex-1 rounded-lg px-3 py-2 border border-gray-300 text-gray-900 bg-white text-sm focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none"
      >
        {data.groups.map((g) => (
          <option key={g.id} value={g.id}>{g.nombre}</option>
        ))}
      </select>

      <button
        onClick={() => setShowBaseInfoPopup(true)}
        className="w-8 h-8 rounded-full bg-[color:var(--color-accent)] text-white flex items-center justify-center text-xs shadow hover:brightness-90 transition"
        title="Ver información base"
      >
        ?
      </button>

      <button
        onClick={handleExit}
        className="w-8 h-8 rounded-md bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition"
      >
        <img src="/LogoutIcon.svg" alt="logout" className="w-3 h-3" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col items-center min-h-screen py-4 px-4 bg-gray-50">
      <BaseInfoPopup
        show={showBaseInfoPopup}
        onClose={() => setShowBaseInfoPopup(false)}
        baseData={data.baseData}
      />

      <div className="w-full max-w-md md:max-w-2xl">
        {isInitialLoading ? (
          renderLoadingState()
        ) : (
          <>
            {data.groups.length > 0 && renderHeader()}

            {data.loadingParticipants ? (
              <div className="flex justify-center gap-2 items-center py-12">
                <Spinner size="lg" color="primary-light" />
                <span className="text-gray-500">Actualizando lista...</span>
              </div>
            ) : (
              <main>
                {/* Casos de estado vacío */}
                {data.groups.length === 0 && (
                  <EmptyState message="No hay grupos disponibles para calificar." />
                )}

                {data.groups.length > 0 && !hasParticipants && data.selectedGroupId && (
                  <EmptyState message="No hay participantes en este grupo." />
                )}

                {/* Carousel principal */}
                {hasParticipants && (
                  <GraderCarousel
                    participantes={actions.participantesToGrade}
                    baseData={data.baseData}
                    calificaciones={actions.calificaciones}
                    errores={actions.errores}
                    carouselIndex={actions.carouselIndex}
                    onPrev={actions.goPrev}
                    onNext={actions.goNext}
                    onInputChange={actions.handleInputChange}
                    submitting={actions.submitting}
                    alreadyGraded={data.alreadyGraded}
                    onSubmit={actions.handleSubmit}
                  />
                )}
              </main>
            )}
          </>
        )}
      </div>

      <ConfirmModalComponent />
    </div>
  );
};

// Componente interno simple para mensajes vacíos
const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12 text-gray-600 animate-fade-in">
    <p className="text-lg font-medium">{message}</p>
  </div>
);