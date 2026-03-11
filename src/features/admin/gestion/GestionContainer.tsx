"use client";

import React, { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Spinner, Skeleton, SkeletonTableRow } from "@/components/UI/Loading";
import { useConfirmModal } from "@/components/UI/ConfirmModal";
import { useRouter } from "next/navigation";

// Feature Hooks
import { useGestionData } from "./hooks/useGestionData";
import { useAssessments } from "./hooks/useAssessments";
import { useClassificationRanges } from "./hooks/useClassificationRanges";
import { useGestionFilters } from "./hooks/useGestionFilters";
import { useGestionActions } from "./hooks/useGestionActions";

// Feature Components
import { GestionToolbar } from "./components/GestionToolbar";
import { ParticipantTable } from "./components/ParticipantTable";
import { ParticipantCardList } from "./components/ParticipantCardList";
import { EditParticipantModal } from "./components/EditParticipantModal";
import { ParticipantDetailModal } from "./components/ParticipantDetailModal";
import { ClassificationRangesModal } from "./components/ClassificationRangesModal";
import { Pagination } from "./components/Pagination";

// Utilities
import { handleExportCSV } from "./utils/gestionUtils";
import { type ParticipantDashboardRow } from "./schemas/gestionSchemas";
import { showToast } from "@/components/UI/Toast";

export const GestionContainer = () => {
  const { isAdmin, isLoading: authLoading, logout, getAuthHeaders } = useAdminAuth();
  const router = useRouter();

  // Domain Hooks
  const { classificationRanges, updateRanges } = useClassificationRanges();
  const { assessments, refreshAssessments } = useAssessments(getAuthHeaders, logout);
  const { data, setData, loading: dataLoading, error: dataError, fetchData } = useGestionData(getAuthHeaders, logout);

  // UI State
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [detailModal, setDetailModal] = useState<ParticipantDashboardRow | null>(null);
  const [isRangesModalOpen, setIsRangesModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Actions Hook
  const {
    editModal,
    setEditModal,
    handleUpdate,
    openEditModal,
    closeEditModal
  } = useGestionActions(getAuthHeaders, logout, setData);

  // Filtering Hook
  const {
    searchTerm, setSearchTerm,
    filterGrupo, setFilterGrupo,
    filterEstado, setFilterEstado,
    filterRol, setFilterRol,
    sortBy, setSortBy,
    sortOrder, setSortOrder,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    filteredAndSortedData,
    paginatedData,
    totalPages,
    grupos,
    baseNumbers,
    getEstadoInfo
  } = useGestionFilters(data, classificationRanges);

  const { ConfirmModalComponent } = useConfirmModal();

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    refreshAssessments();
  }, [authLoading, isAdmin, refreshAssessments]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    fetchData(selectedAssessment);
  }, [authLoading, isAdmin, selectedAssessment, fetchData]);

  const onExportCSV = () => {
    setExporting(true);
    handleExportCSV(filteredAndSortedData, baseNumbers, getEstadoInfo);
    setExporting(false);
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="custom" customColor="var(--color-accent)" />
        <p className="text-[color:var(--color-text)] text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  if (dataLoading && data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-2 sm:px-4 bg-white">
        <div className="w-full max-w-7xl flex justify-between items-center mb-4 sm:mb-8 px-2">
          <h1 className="text-3xl font-extrabold text-gray-900">Gestión del Assessment</h1>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <Spinner size="lg" color="custom" customColor="var(--color-accent)" />
          <span className="text-[color:var(--color-muted)] text-lg">Cargando datos...</span>
        </div>
        <div className="hidden lg:block w-full max-w-7xl bg-white shadow rounded-xl overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-white/20">
            <Skeleton className="h-6 w-48" />
          </div>
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonTableRow key={i} />)}
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p className="text-error text-xl">{dataError}</p>
        <button
          onClick={() => router.refresh()}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-[color:var(--color-accent)] hover:text-white"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      <div className="w-full max-w-7xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 px-1 sm:px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center sm:text-left">Gestión del Assessment</h1>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          <button onClick={() => router.push("/admin")} className="bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm font-medium transition">Admin</button>
          <button onClick={logout} className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition">Cerrar Sesión</button>
        </div>
      </div>

      <GestionToolbar
        assessments={assessments}
        selectedAssessment={selectedAssessment}
        setSelectedAssessment={setSelectedAssessment}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterGrupo={filterGrupo}
        setFilterGrupo={setFilterGrupo}
        filterEstado={filterEstado}
        setFilterEstado={setFilterEstado}
        filterRol={filterRol}
        setFilterRol={setFilterRol}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        onRefresh={() => fetchData(selectedAssessment)}
        onExport={onExportCSV}
        onOpenRanges={() => setIsRangesModalOpen(true)}
        grupos={grupos}
        loading={dataLoading}
        exporting={exporting}
      />

      <ParticipantTable
        paginatedData={paginatedData}
        baseNumbers={baseNumbers}
        getEstadoInfo={getEstadoInfo}
        onEdit={openEditModal}
        onDetail={setDetailModal}
      />

      <ParticipantCardList
        paginatedData={paginatedData}
        getEstadoInfo={getEstadoInfo}
        onEdit={openEditModal}
        onDetail={setDetailModal}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        setCurrentPage={setCurrentPage}
      />

      {isRangesModalOpen && (
        <ClassificationRangesModal
          classificationRanges={classificationRanges}
          onSave={(ranges) => { updateRanges(ranges); setIsRangesModalOpen(false); showToast.success("Rangos actualizados"); }}
          onClose={() => setIsRangesModalOpen(false)}
        />
      )}

      {detailModal && (
        <ParticipantDetailModal
          detailModal={detailModal}
          onClose={() => setDetailModal(null)}
          getEstadoInfo={getEstadoInfo}
        />
      )}

      {editModal && (
        <EditParticipantModal
          editModal={editModal}
          setEditModal={setEditModal}
          onCancel={closeEditModal}
          onUpdate={handleUpdate}
        />
      )}

      <ConfirmModalComponent />
    </div>
  );
};
