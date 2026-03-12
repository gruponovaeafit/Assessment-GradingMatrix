'use client';

import React, { useState, useEffect } from 'react';
import { useGraderAuth } from "@/hooks/useGraderAuth";
import { Spinner, SkeletonBaseInfo, SkeletonUserCard } from '@/components/UI/Loading';
import { useConfirmModal } from '@/components/UI/ConfirmModal';

// Feature components & hooks
import { useGraderData } from '../hooks/useGraderData';
import { useGraderActions } from '../hooks/useGraderActions';
import { BaseInfoPopup } from './BaseInfoPopup';
import { GraderCarousel } from './GraderCarousel';

export const GraderContainer: React.FC = () => {
  const { isGrader, isLoading: authLoading, requireGrader } = useGraderAuth();
  const { confirm, setIsLoading, ConfirmModalComponent } = useConfirmModal();

  // Data hook
  const {
    loading,
    loadingParticipants,
    groups,
    setGroups,
    selectedGroupId,
    setSelectedGroupId,
    usuarios,
    setUsuarios,
    baseData,
    alreadyGraded,
    setAlreadyGraded,
    checkingStatus
  } = useGraderData();

  // Actions hook
  const {
    calificaciones,
    errores,
    submitting,
    carouselIndex,
    handleInputChange,
    handleSubmit,
    goPrev,
    goNext,
    participantesToGrade
  } = useGraderActions(
    usuarios,
    selectedGroupId,
    alreadyGraded,
    setAlreadyGraded,
    groups,
    setGroups,
    setSelectedGroupId,
    setUsuarios,
    confirm,
    setIsLoading
  );

  const [showBaseInfoPopup, setShowBaseInfoPopup] = useState(false);

  useEffect(() => {
    requireGrader();
  }, [requireGrader]);

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-4 bg-white">
        <div className="flex items-center gap-3 mb-6">
          <Spinner size="lg" color="primary-light" />
          <span className="text-gray-500 text-xl font-medium">Cargando datos...</span>
        </div>
        <SkeletonBaseInfo />
        <div className="flex flex-col items-center gap-6 sm:gap-8 w-full mt-6">
          {[1, 2].map((i) => (
            <SkeletonUserCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const hasParticipants = participantesToGrade.length > 0;

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-10 px-4 bg-white">
      <BaseInfoPopup 
        show={showBaseInfoPopup} 
        onClose={() => setShowBaseInfoPopup(false)} 
        baseData={baseData} 
      />

      <div className="w-full max-w-2xl">
        {/* Selector de grupo */}
        {groups.length > 0 && (
          <div className="mb-3">
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 border border-gray-300 text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
              aria-label="Grupo a calificar"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {loadingParticipants && (
          <div className="flex justify-center gap-2 items-center py-8">
            <Spinner size="lg" color="primary-light" />
            <span className="text-gray-500">Cargando participantes...</span>
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            <p className="text-lg">No hay grupos disponibles para calificar.</p>
          </div>
        )}
        
        {!loadingParticipants && !hasParticipants && selectedGroupId && groups.length > 0 && (
          <div className="text-center py-8 text-gray-600">
            <p className="text-lg">No hay participantes en este grupo.</p>
          </div>
        )}

        {!loadingParticipants && hasParticipants && (
          <>
            <GraderCarousel 
              participantes={participantesToGrade}
              baseData={baseData}
              calificaciones={calificaciones}
              errores={errores}
              carouselIndex={carouselIndex}
              onPrev={goPrev}
              onNext={goNext}
              onInputChange={handleInputChange}
              onShowBaseInfo={() => setShowBaseInfoPopup(true)}
              submitting={submitting}
              alreadyGraded={alreadyGraded}
            />

            <div className="w-full flex justify-center mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitting || alreadyGraded}
                className="bg-[color:var(--color-accent)] text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-[#5B21B6] transition disabled:opacity-60"
              >
                {submitting ? 'Enviando...' : alreadyGraded ? 'Ya calificado' : 'Enviar calificaciones'}
              </button>
            </div>
          </>
        )}
      </div>
      <ConfirmModalComponent />
    </div>
  );
};
