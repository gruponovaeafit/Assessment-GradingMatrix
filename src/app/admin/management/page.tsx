"use client";

import React, { useEffect, useState } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Spinner, Skeleton, SkeletonTableRow } from "@/components/UI/Loading";
import { useConfirmModal } from "@/components/UI/ConfirmModal";
import { useRouter } from "next/navigation";
import Image from "next/image";

// UI Components
import { Box } from "@/components/UI/Box";
import { Button } from "@/components/UI/Button";

// Feature Hooks
import { useGestionData } from "@/features/admin/management/hooks/useGestionData";
import { useAssessments } from "@/features/admin/management/hooks/useAssessments";
import { useClassificationRanges } from "@/features/admin/management/hooks/useClassificationRanges";
import { useGestionFilters } from "@/features/admin/management/hooks/useGestionFilters";
import { useGestionActions } from "@/features/admin/management/hooks/useGestionActions";

// Feature Components
import { GestionToolbar } from "@/features/admin/management/components/GestionToolbar";
import { ParticipantTable } from "@/features/admin/management/components/ParticipantTable";
import { ParticipantCardList } from "@/features/admin/management/components/ParticipantCardList";
import { EditParticipantModal } from "@/features/admin/management/components/EditParticipantModal";
import { ParticipantDetailModal } from "@/features/admin/management/components/ParticipantDetailModal";
import { Pagination } from "@/features/admin/management/components/Pagination";

// Utilities
import { handleExportCSV } from "@/features/admin/management/utils/gestionUtils";
import { type ParticipantDashboardRow, type ClassificationRanges } from "@/features/admin/management/schemas/gestionSchemas";

// ─── RangesInline — fuera del page para no perder foco ───────────────────────
interface RangesInlineProps {
  localRanges: ClassificationRanges;
  inputValues: { group: string; interview: string };
  onChange: (key: "group" | "interview", value: string) => void;
  onBlur: (key: "group" | "interview") => void;
}

const RangesInline: React.FC<RangesInlineProps> = ({ localRanges, inputValues, onChange, onBlur }) => (
  <div className="mt-4 w-full bg-white border border-gray-300 rounded-lg px-4 py-3">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-black">Rangos de clasificación</p>
        <p className="text-xs text-gray-500">
          Ajusta los límites para cada estado. No es gestión en la base.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-black">Grupo</span>
          <input
            type="number" step="0.01" min="0" max="5"
            value={inputValues.group}
            onChange={(e) => onChange("group", e.target.value)}
            onBlur={() => onBlur("group")}
            className="w-16 px-2 py-1 text-sm text-center text-black rounded-lg border border-gray-300 focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-black">Entrevista</span>
          <input
            type="number" step="0.01" min="0" max="5"
            value={inputValues.interview}
            onChange={(e) => onChange("interview", e.target.value)}
            onBlur={() => onBlur("interview")}
            className="w-16 px-2 py-1 text-sm text-center text-black rounded-lg border border-gray-300 focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-black">Discusión</span>
          <input
            type="number" value={localRanges.discussion}
            readOnly tabIndex={-1}
            className="w-16 px-2 py-1 text-sm text-center text-gray-500 rounded-lg border border-gray-300 bg-gray-300 cursor-not-allowed outline-none"
          />
        </div>
      </div>
    </div>
  </div>
);

// ─── HeaderButtons — fuera del page ──────────────────────────────────────────
interface HeaderButtonsProps {
  dataLoading: boolean;
  exporting: boolean;
  selectedAssessment: string;
  onRefresh: () => void;
  onExport: () => void;
  onAdmin: () => void;
  onLogout: () => void;
}

const HeaderButtons: React.FC<HeaderButtonsProps> = ({
  dataLoading, exporting, selectedAssessment, onRefresh, onExport, onAdmin, onLogout,
}) => (
  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
    <Button
      variant="outline"
      className="!bg-gray-500 !text-white !border-gray-500 hover:!bg-gray-600 hover:!border-gray-600"
      loading={dataLoading}
      onClick={onRefresh}
    >
      <Image src="/ReloadTableIcon.svg" alt="" width={18} height={18} className="mr-2" />
      Actualizar tabla
    </Button>
    <Button variant="accent" onClick={onAdmin}>
      <Image src="/HomeIcon.svg" alt="" width={18} height={18} className="mr-2" />
      Menú principal
    </Button>
    <Button variant="success" loading={exporting} onClick={onExport} disabled={!selectedAssessment}>
      <Image src="/ExportCSVIcon.svg" alt="" width={18} height={18} className="mr-2" />
      Exportar CSV
    </Button>
    <Button variant="error" onClick={onLogout}>
      <Image src="/LogoutIcon.svg" alt="" width={18} height={18} className="mr-2" />
      Cerrar Sesión
    </Button>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GestionPage() {
  const { isAdmin, isLoading: authLoading, logout } = useAdminAuth();
  const router = useRouter();

  const [selectedAssessment, setSelectedAssessment] = useState<string>("");

  // Rangos por assessment — pasa el ID para que cargue/guarde por separado
  const { classificationRanges, updateRanges } = useClassificationRanges(selectedAssessment);

  const { assessments, refreshAssessments } = useAssessments(logout);
  const { data, setData, loading: dataLoading, error: dataError, fetchData } = useGestionData(logout);

  const [detailModal, setDetailModal] = useState<ParticipantDashboardRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const [localRanges, setLocalRanges] = useState<ClassificationRanges>(classificationRanges);
  const [inputValues, setInputValues] = useState({
    group: String(classificationRanges.group),
    interview: String(classificationRanges.interview),
  });

  // Sincroniza inputs cuando cambian los rangos (por cambio de assessment)
  useEffect(() => {
    setLocalRanges(classificationRanges);
    setInputValues({
      group: String(classificationRanges.group),
      interview: String(classificationRanges.interview),
    });
  }, [classificationRanges]);

  const handleRangeChange = (key: "group" | "interview", value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      const next = { ...localRanges, [key]: parsed };
      setLocalRanges(next);
      updateRanges(next);
    }
  };

  const handleRangeBlur = (key: "group" | "interview") => {
    const parsed = parseFloat(inputValues[key]);
    if (isNaN(parsed)) {
      setInputValues((prev) => ({ ...prev, [key]: String(localRanges[key]) }));
    }
  };

  const { editModal, setEditModal, handleUpdate, openEditModal, closeEditModal } = useGestionActions(logout, setData);

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
    getEstadoInfo,
  } = useGestionFilters(data, localRanges);

  const { ConfirmModalComponent } = useConfirmModal();

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    refreshAssessments();
  }, [authLoading, isAdmin, refreshAssessments]);

  // Cuando cambia el assessment, recarga la tabla con el nuevo ID
  useEffect(() => {
    if (authLoading || !isAdmin) return;
    fetchData(selectedAssessment || undefined);
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
      <div className="flex flex-col items-center justify-center min-h-screen py-8 px-4 bg-white">
        <div className="w-full max-w-7xl flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-[color:var(--color-accent)]">Gestión del Assessment</h1>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <Spinner size="lg" color="custom" customColor="var(--color-accent)" />
          <span className="text-[color:var(--color-muted)] text-lg">Cargando datos...</span>
        </div>
        <div className="hidden lg:block w-full max-w-7xl bg-white shadow rounded-xl overflow-hidden border border-gray-100">
          <div className="p-4 border-b"><Skeleton className="h-6 w-48" /></div>
          {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonTableRow key={i} />)}
        </div>
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p className="text-error text-xl">{dataError}</p>
        <Button variant="outline" onClick={() => router.refresh()} className="mt-4">Reintentar</Button>
      </div>
    );
  }

  if (!selectedAssessment) {
    return (
      <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
        <div className="w-full max-w-7xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 px-1 sm:px-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--color-accent)]">
            Gestión del Assessment
          </h1>
          <HeaderButtons
            dataLoading={dataLoading} exporting={exporting}
            selectedAssessment={selectedAssessment}
            onRefresh={() => fetchData(undefined)} onExport={onExportCSV}
            onAdmin={() => router.push("/admin")} onLogout={logout}
          />
        </div>
        <div className="w-full max-w-7xl">
          <Box>
            <GestionToolbar
              assessments={assessments}
              selectedAssessment={selectedAssessment}
              setSelectedAssessment={setSelectedAssessment}
              searchTerm="" setSearchTerm={() => {}}
              filterGrupo="todos" setFilterGrupo={() => {}}
              filterEstado="todos" setFilterEstado={() => {}}
              filterRol="todos" setFilterRol={() => {}}
              sortBy="nombre" setSortBy={() => {}}
              sortOrder="asc" setSortOrder={() => {}}
              itemsPerPage={10} setItemsPerPage={() => {}}
              grupos={[]}
            />
            <RangesInline
              localRanges={localRanges} inputValues={inputValues}
              onChange={handleRangeChange} onBlur={handleRangeBlur}
            />
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-gray-500">Selecciona un assessment para ver los resultados.</p>
            </div>
          </Box>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">

      <div className="w-full max-w-7xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 px-1 sm:px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--color-accent)]">
          Gestión del Assessment
        </h1>
        <HeaderButtons
          dataLoading={dataLoading} exporting={exporting}
          selectedAssessment={selectedAssessment}
          onRefresh={() => fetchData(selectedAssessment)} onExport={onExportCSV}
          onAdmin={() => router.push("/admin")} onLogout={logout}
        />
      </div>

      <div className="w-full max-w-7xl mb-3">
        <Box>
          <GestionToolbar
            assessments={assessments}
            selectedAssessment={selectedAssessment}
            setSelectedAssessment={setSelectedAssessment}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            filterGrupo={filterGrupo} setFilterGrupo={setFilterGrupo}
            filterEstado={filterEstado} setFilterEstado={setFilterEstado}
            filterRol={filterRol} setFilterRol={setFilterRol}
            sortBy={sortBy} setSortBy={setSortBy}
            sortOrder={sortOrder} setSortOrder={setSortOrder}
            itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage}
            grupos={grupos}
          />
          <RangesInline
            localRanges={localRanges} inputValues={inputValues}
            onChange={handleRangeChange} onBlur={handleRangeBlur}
          />
        </Box>
      </div>

      <div className="w-full max-w-7xl px-1 mb-3">
        <p className="text-xs text-gray-400">
          Mostrando {paginatedData.length} de {filteredAndSortedData.length} resultados
        </p>
      </div>

      <div className="w-full max-w-7xl">
        <Box className="!p-0 overflow-hidden">
          <ParticipantTable
            paginatedData={paginatedData}
            baseNumbers={baseNumbers}
            getEstadoInfo={getEstadoInfo}
            onEdit={openEditModal}
            onDetail={setDetailModal}
          />
          <div className="px-4">
            <ParticipantCardList
              paginatedData={paginatedData}
              getEstadoInfo={getEstadoInfo}
              onEdit={openEditModal}
              onDetail={setDetailModal}
            />
          </div>
          <div className="px-4 pb-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </Box>
      </div>

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
}