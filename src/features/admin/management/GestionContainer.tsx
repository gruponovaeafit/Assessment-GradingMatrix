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
import { notify, NotificationProvider } from "@/components/UI/Notification";

// Feature Hooks
import { useGestionData } from "./hooks/useGestionData";
import { useClassificationRanges } from "./hooks/useClassificationRanges";
import { useGestionFilters } from "./hooks/useGestionFilters";
import { useGestionActions } from "./hooks/useGestionActions";

// Feature Components
import { GestionToolbar } from "./components/GestionToolbar";
import { ParticipantTable } from "./components/ParticipantTable";
import { ParticipantCardList } from "./components/ParticipantCardList";
import { EditParticipantModal } from "./components/EditParticipantModal";
import { ParticipantDetailModal } from "./components/ParticipantDetailModal";
import { Pagination } from "./components/Pagination";

// Utilities
import { handleExportCSV } from "./utils/gestionUtils";
import { type ParticipantDashboardRow, type ClassificationRanges } from "./schemas/gestionSchemas";
import { showToast } from "@/components/UI/Toast";

// ─── RangesInline — fuera del page para no perder foco ───────────────────────
interface RangesInlineProps {
  localRanges: ClassificationRanges;
  inputValues: { group: string; interview: string; discussion: string };
  onChange: (key: "group" | "interview" | "discussion", value: string) => void;
  onBlur: (key: "group" | "interview" | "discussion") => void;
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
            type="number" step="0.1" min="0" max="5"
            value={inputValues.group}
            onChange={(e) => onChange("group", e.target.value)}
            onBlur={() => onBlur("group")}
            className="w-16 px-2 py-1 text-sm text-center text-black rounded-lg border border-gray-300 focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-black">Entrevista</span>
          <input
            type="number" step="0.1" min="0" max="5"
            value={inputValues.interview}
            onChange={(e) => onChange("interview", e.target.value)}
            onBlur={() => onBlur("interview")}
            className="w-16 px-2 py-1 text-sm text-center text-black rounded-lg border border-gray-300 focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-black">Discusión</span>
          <input
            type="number" step="0.1" min="0" max="5"
            value={inputValues.discussion}
            onChange={(e) => onChange("discussion", e.target.value)}
            onBlur={() => onBlur("discussion")}
            className="w-16 px-2 py-1 text-sm text-center text-black rounded-lg border border-gray-300 focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition"
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
  onRefresh: () => void;
  onExport: () => void;
  onAdmin: () => void;
  onLogout: () => void;
}

const HeaderButtons: React.FC<HeaderButtonsProps> = ({
  dataLoading, exporting, onRefresh, onExport, onAdmin, onLogout,
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
    <Button variant="success" loading={exporting} onClick={onExport}>
      <Image src="/ExportCSVIcon.svg" alt="" width={18} height={18} className="mr-2" />
      Exportar CSV
    </Button>
    <Button variant="error" onClick={onLogout}>
      <Image src="/LogoutIcon.svg" alt="" width={18} height={18} className="mr-2" />
      Cerrar Sesión
    </Button>
  </div>
);

// ─── Page Container ──────────────────────────────────────────────────────────
export const GestionContainer = () => {
  const { isAdmin, isLoading: authLoading, logout } = useAdminAuth();
  const router = useRouter();

  // Rangos de clasificación (el assessmentId lo infiere el backend del JWT)
  const { classificationRanges, updateRanges } = useClassificationRanges("");
  const { data, setData, loading: dataLoading, error: dataError, fetchData } = useGestionData(logout);

  const [detailModal, setDetailModal] = useState<ParticipantDashboardRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const [localRanges, setLocalRanges] = useState<ClassificationRanges>(classificationRanges);
  const [inputValues, setInputValues] = useState({
    group: String(classificationRanges.group),
    interview: String(classificationRanges.interview),
    discussion: String(classificationRanges.discussion),
  });

  // Sincroniza inputs cuando cambian los rangos (por cambio de assessment)
  useEffect(() => {
    setLocalRanges(classificationRanges);
    setInputValues({
      group: String(classificationRanges.group),
      interview: String(classificationRanges.interview),
      discussion: String(classificationRanges.discussion),
    });
  }, [classificationRanges]);

  const handleRangeChange = (key: "group" | "interview" | "discussion", value: string) => {
    setInputValues((prev) => ({ ...prev, [key]: value }));
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      const next = { ...localRanges, [key]: parsed };
      setLocalRanges(next);
      updateRanges(next);
      showToast.success("Rangos actualizados");
    }
  };

  const handleRangeBlur = (key: "group" | "interview" | "discussion") => {
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

  const hasActiveFilters =
    !!searchTerm ||
    filterGrupo !== "todos" ||
    filterEstado !== "todos" ||
    filterRol !== "todos";  
  useEffect(() => {
    if (authLoading || !isAdmin) return;
    fetchData();
  }, [authLoading, isAdmin, fetchData]);

  const onExportCSV = () => {
    setExporting(true);
    const total = handleExportCSV(
      filteredAndSortedData,
      baseNumbers,
      getEstadoInfo,
      () => notify({                        // ← onError
        title: "Error al exportar",
        titleColor: "var(--error)",
        subtitle: "No se pudo exportar el archivo CSV",
        subtitleColor: "var(--color-muted)",
        borderColor: "var(--error)",
        duration: 3000,
      })
    );
    setExporting(false);
    if (total > 0) {
      notify({
        title: "Exportación Exitosa",
        titleColor: "var(--success)",
        subtitle: "El archivo CSV fue exportado correctamente",
        subtitleColor: "var(--color-muted)",
        borderColor: "var(--success)",
        idLabel: "Se exportaron",
        idValue: `${total} registros`,
        idColor: "var(--success)",
        duration: 3000,
      });
    }
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

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">

      <div className="w-full max-w-7xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 px-1 sm:px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[color:var(--color-accent)]">
          Gestión del Assessment
        </h1>
        <HeaderButtons
          dataLoading={dataLoading} exporting={exporting}
          onRefresh={() => {
            fetchData();
            notify({
              title: "Tabla Actualizada",
              titleColor: "var(--color-accent)",
              subtitle: "Los datos fueron recargados correctamente",
              subtitleColor: "var(--color-muted)",
              borderColor: "var(--color-accent)",
              duration: 3000,
            });
          }} 
          onExport={onExportCSV}
          onAdmin={() => router.push("/admin")} 
          onLogout={() => {
            notify({
              title: "Sesión Cerrada",
              titleColor: "var(--error)",
              subtitle: "Has cerrado sesión correctamente",
              subtitleColor: "var(--color-muted)",
              borderColor: "var(--error)",
              duration: 2500,
            });
            setTimeout(() => logout(), 800); // Pequeño delay para que se vea la noti
          }}
        />
      </div>

      <div className="w-full max-w-7xl mb-3">
        <Box>
          <GestionToolbar
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            filterGrupo={filterGrupo} setFilterGrupo={setFilterGrupo}
            filterEstado={filterEstado} setFilterEstado={setFilterEstado}
            filterRol={filterRol} setFilterRol={setFilterRol}
            sortBy={sortBy} setSortBy={setSortBy}
            sortOrder={sortOrder} setSortOrder={setSortOrder}
            itemsPerPage={itemsPerPage} setItemsPerPage={setItemsPerPage}
            onRefresh={() => fetchData()}
            onExport={onExportCSV}
            grupos={grupos}
            loading={dataLoading}
            exporting={exporting}
            onClearFilters={() => {
              if (hasActiveFilters) {   // necesitas pasar hasActiveFilters o calcularlo aquí
                setSearchTerm("");
                setFilterGrupo("todos");
                setFilterEstado("todos");
                setFilterRol("todos");
                notify({
                  title: "Filtros Limpiados",
                  titleColor: "var(--color-accent)",
                  subtitle: "Se eliminaron todos los filtros activos",
                  subtitleColor: "var(--color-muted)",
                  borderColor: "var(--color-accent)",
                  duration: 3000,
                });
              } else {
                notify({
                  title: "Sin filtros activos",
                  titleColor: "var(--warning)",
                  subtitle: "No hay filtros aplicados para limpiar",
                  subtitleColor: "var(--color-muted)",
                  borderColor: "var(--warning)",
                  duration: 2500,
                });
              }
  }}
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
      <NotificationProvider />
    </div>

  );
};