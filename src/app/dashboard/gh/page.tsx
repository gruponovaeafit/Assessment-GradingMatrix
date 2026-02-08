"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../../Hooks/useAdminAuth";
import { Spinner, Skeleton, SkeletonTableRow } from "../../components/UI/Loading";
import { showToast } from "../../components/UI/Toast";
import { useConfirmModal } from "../../components/UI/ConfirmModal";
import { stringify } from "csv-stringify/sync";
import { saveAs } from "file-saver";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";

interface Calificacion {
  ID: number;
  Grupo: string;
  Participante: string;
  Correo: string;
  role: string;
  Foto?: string | null;
  Calificacion_Promedio: number | null;
  Estado: string;
  Calificacion_Base_1?: number | null;
  Calificacion_Base_2?: number | null;
  Calificacion_Base_3?: number | null;
  Calificacion_Base_4?: number | null;
  Calificacion_Base_5?: number | null;
}

// Placeholder cuando no hay foto o falla la carga (SVG inline para no depender de archivo)
const FOTO_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Ccircle fill='%23e5e7eb' cx='32' cy='32' r='32'/%3E%3Ccircle fill='%239ca3af' cx='32' cy='26' r='10'/%3E%3Cellipse fill='%239ca3af' cx='32' cy='56' rx='18' ry='14'/%3E%3C/svg%3E";

export default function GhDashboard() {
  const { isAdmin, isLoading: authLoading, requireAdmin, logout, getAuthHeaders } = useAdminAuth();
  const router = useRouter();

  const [data, setData] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<{ id: number; nombre: string; activo: boolean }[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");

  const [editModal, setEditModal] = useState<Calificacion | null>(null);
  const [originalData, setOriginalData] = useState<Calificacion | null>(null);
  const [detailModal, setDetailModal] = useState<Calificacion | null>(null);

  // Estados para búsqueda, filtros, orden y paginación
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrupo, setFilterGrupo] = useState<string>("todos");
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [filterRol, setFilterRol] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<"nombre" | "promedio" | "grupo">("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [exporting, setExporting] = useState(false);
  const [classificationRanges, setClassificationRanges] = useState({
    group: 4.7,
    interview: 4.0,
    discussion: 3.6,
  });
  const rangesStorageKey = "ghClassificationRanges";

  const normalizeRanges = (next: typeof classificationRanges) => {
    const group = Math.max(0, Math.min(5, next.group));
    const interview = Math.max(0, Math.min(5, Math.min(next.interview, group)));
    const discussion = Math.max(3.6, Math.min(5, Math.min(next.discussion, interview)));
    return { group, interview, discussion };
  };

  useEffect(() => {
    const stored = localStorage.getItem(rangesStorageKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<typeof classificationRanges>;
      if (
        typeof parsed.group === "number" &&
        typeof parsed.interview === "number" &&
        typeof parsed.discussion === "number"
      ) {
        setClassificationRanges(normalizeRanges(parsed as typeof classificationRanges));
      }
    } catch {
      localStorage.removeItem(rangesStorageKey);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(rangesStorageKey, JSON.stringify(classificationRanges));
  }, [classificationRanges]);

  // Confirm modal (lo dejo tal cual, por si lo usas después)
  const { confirm, setIsLoading: setModalLoading, ConfirmModalComponent } = useConfirmModal();

  const getEstadoInfo = (promedio: number | null) => {
    if (promedio == null) return { texto: "Pendiente", color: "text-white/60" };
    if (promedio >= classificationRanges.group) return { texto: "✅ Pasa al grupo", color: "text-success" };
    if (promedio >= classificationRanges.interview)
      return { texto: "📋 Pasa a entrevista", color: "text-success-light" };
    if (promedio >= classificationRanges.discussion)
      return { texto: "⚠️ Pasa a discusión", color: "text-yellow-400" };
    return { texto: "❌ No pasa", color: "text-error" };
  };

  // Proteger la ruta
  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  // Cargar lista de assessments solo una vez cuando el auth está listo (getAuthHeaders no en deps para evitar refetch en cada render)
  const hasFetchedAssessmentsRef = React.useRef(false);
  useEffect(() => {
    if (authLoading || !isAdmin) return;
    if (hasFetchedAssessmentsRef.current) return;
    hasFetchedAssessmentsRef.current = true;
    (async () => {
      try {
        const response = await authFetch(
          "/api/assessment/list",
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );
        if (!response.ok) throw new Error("Error al cargar assessments");
        const result = await response.json();
        setAssessments(result || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [authLoading, isAdmin]);

  const fetchDataRef = React.useRef<() => Promise<void>>(async () => {});

  React.useEffect(() => {
    fetchDataRef.current = async () => {
      if (!isAdmin) return;
      setLoading(true);
      setError(null);
      try {
        const query = selectedAssessment ? `?assessmentId=${selectedAssessment}` : "";
        const response = await authFetch(
          `/api/dashboard/gh${query}`,
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result?.error || "Error al cargar los datos");
        }
        setData(result);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al cargar los datos";
        if (!message.toLowerCase().includes("no autorizado")) {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };
  });

  // Solo cargar datos al quedar listo el auth o al cambiar el assessment; no refetch por re-renders
  const lastFetchedAssessmentRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (authLoading || !isAdmin) return;
    if (lastFetchedAssessmentRef.current === selectedAssessment) return;
    lastFetchedAssessmentRef.current = selectedAssessment;
    fetchDataRef.current();
  }, [authLoading, isAdmin, selectedAssessment]);

  const grupos = useMemo(() => {
    const uniqueGrupos = [...new Set(data.map((item) => item.Grupo))];
    return uniqueGrupos.sort();
  }, [data]);

  const filteredAndSortedData = useMemo(() => {
    let filtered = data.filter((item) => {
      const matchSearch =
        item.Participante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Correo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchGrupo = filterGrupo === "todos" || item.Grupo === filterGrupo;

      const estado = getEstadoInfo(item.Calificacion_Promedio).texto;
      const matchEstado = filterEstado === "todos" || estado === filterEstado;

      const matchRol =
        filterRol === "todos" ||
        (filterRol === "infiltrado" && item.role === "1") ||
        (filterRol === "aspirante" && item.role === "0");

      return matchSearch && matchGrupo && matchEstado && matchRol;
    });

    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "nombre":
          comparison = a.Participante.localeCompare(b.Participante);
          break;
        case "promedio": {
          const promedioA = a.Calificacion_Promedio ?? -1;
          const promedioB = b.Calificacion_Promedio ?? -1;
          comparison = promedioA - promedioB;
          break;
        }
        case "grupo":
          comparison = a.Grupo.localeCompare(b.Grupo);
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, filterGrupo, filterEstado, filterRol, sortBy, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGrupo, filterEstado, filterRol, selectedAssessment, itemsPerPage]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const exportRows = filteredAndSortedData.map((item) => ({
        Nombre: item.Participante,
        Correo: item.Correo,
        Rol: item.role === "1" ? "Infiltrado" : "Aspirante",
        Grupo: item.Grupo,
        "Base 1": item.Calificacion_Base_1 != null ? item.Calificacion_Base_1.toFixed(2) : "N/A",
        "Base 2": item.Calificacion_Base_2 != null ? item.Calificacion_Base_2.toFixed(2) : "N/A",
        "Base 3": item.Calificacion_Base_3 != null ? item.Calificacion_Base_3.toFixed(2) : "N/A",
        "Base 4": item.Calificacion_Base_4 != null ? item.Calificacion_Base_4.toFixed(2) : "N/A",
        "Base 5": item.Calificacion_Base_5 != null ? item.Calificacion_Base_5.toFixed(2) : "N/A",
        Promedio: item.Calificacion_Promedio != null ? item.Calificacion_Promedio.toFixed(2) : "N/A",
        Estado: getEstadoInfo(item.Calificacion_Promedio).texto,
      }));

      const csv = stringify(exportRows, {
        header: true,
        columns: Object.keys(exportRows[0] ?? {}),
        delimiter: ";",
      });

      // BOM para que Excel abra UTF-8 (tildes/ñ) correctamente
      const bom = "\uFEFF";
      const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });

      const fecha = new Date().toISOString().split("T")[0];
      saveAs(blob, `calificaciones_${fecha}.csv`);

      showToast.success(`Se exportaron ${exportRows.length} registros`);
    } catch {
      showToast.error("Error al exportar a CSV");
    } finally {
      setExporting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || !originalData) return;

    const updates: Record<string, string | number> = { id: editModal.ID };
    if (editModal.Participante !== originalData.Participante) updates.nombre = editModal.Participante;
    if (editModal.Correo !== originalData.Correo) updates.correo = editModal.Correo;
    if (editModal.role !== originalData.role) updates.role = editModal.role;

    if (Object.keys(updates).length === 1) {
      showToast.error("Debe modificarse al menos un campo");
      return;
    }

    const res = await fetch("/api/update-person", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(updates),
    });

    const result = await res.json();
    if (res.ok) {
      showToast.success("Participante actualizado correctamente");
      setData((prev) => prev.map((p) => (p.ID === editModal.ID ? { ...p, ...editModal } : p)));
      setEditModal(null);
      setOriginalData(null);
    } else {
      showToast.error(result.error || "Error al actualizar");
    }
  };

  // Loading auth
  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="custom" customColor="var(--color-accent)" />
        <p className="text-[color:var(--color-text)] text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  if (loading) {
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
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonTableRow key={i} />
          ))}
        </div>

        <div className="lg:hidden w-full max-w-md space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white shadow rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p className="text-error text-xl">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-[color:var(--color-accent)] hover:text-white"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      {/* Header */}
      <div className="w-full max-w-7xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 px-1 sm:px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center sm:text-left">
          Gestión del Assessment
        </h1>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          <button
            onClick={() => (window.location.href = "/admin")}
            className="bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Admin
          </button>
          <button
            onClick={() => fetchDataRef.current()}
            disabled={loading}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
            title="Actualizar datos"
          >
            {loading ? (
              <Spinner size="sm" color="white" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            onClick={handleExportCSV}
            disabled={exporting}
            className="bg-success hover:bg-success-dark text-white px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? (
              <Spinner size="sm" color="white" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            )}
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>

          <button
            onClick={logout}
            className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="w-full max-w-7xl mb-4 px-1 sm:px-2">
        <div className="bg-white shadow rounded-xl p-4 space-y-4 border border-gray-100">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[color:var(--color-accent)] focus:outline-none transition text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            <select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-[color:var(--color-accent)] focus:outline-none text-base"
            >
              <option value="">Assessment (por defecto)</option>
              {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.nombre} {assessment.activo ? "(Activo)" : "(Inactivo)"}
                </option>
              ))}
            </select>
            <select
              value={filterGrupo}
              onChange={(e) => setFilterGrupo(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-[color:var(--color-accent)] focus:outline-none text-base"
            >
              <option value="todos" className="text-black">
                Todos los grupos
              </option>
              {grupos.map((grupo) => (
                <option key={grupo} value={grupo} className="text-black">
                  {grupo}
                </option>
              ))}
            </select>

            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[color:var(--color-bg)] text-[color:var(--color-text)] border border-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none text-sm"
            >
              <option value="todos" className="text-black">
                Todos los estados
              </option>
              <option value="✅ Pasa al grupo" className="text-black">
                ✅ Pasa al grupo
              </option>
              <option value="📋 Pasa a entrevista" className="text-black">
                📋 Pasa a entrevista
              </option>
              <option value="⚠️ Pasa a discusión" className="text-black">
                ⚠️ Pasa a discusión
              </option>
              <option value="❌ No pasa" className="text-black">
                ❌ No pasa
              </option>
              <option value="Pendiente" className="text-black">
                Pendiente
              </option>
            </select>

            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="px-3 py-2 rounded-lg bg-[color:var(--color-bg)] text-[color:var(--color-text)] border border-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none text-sm"
            >
              <option value="todos" className="text-black">
                Todos los roles
              </option>
              <option value="aspirante" className="text-black">
                Aspirantes
              </option>
              <option value="infiltrado" className="text-black">
                Infiltrados
              </option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "nombre" | "promedio" | "grupo")}
              className="px-3 py-2 rounded-lg bg-[color:var(--color-bg)] text-[color:var(--color-text)] border border-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none text-sm"
            >
              <option value="nombre" className="text-black">
                Ordenar: Nombre
              </option>
              <option value="promedio" className="text-black">
                Ordenar: Promedio
              </option>
              <option value="grupo" className="text-black">
                Ordenar: Grupo
              </option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-2 rounded-lg bg-[color:var(--color-bg)] text-[color:var(--color-text)] border border-[color:var(--color-muted)] hover:bg-[color:var(--color-surface)] transition text-sm flex items-center justify-center gap-1"
            >
              {sortOrder === "asc" ? "↑ Ascendente" : "↓ Descendente"}
            </button>

            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-[color:var(--color-bg)] text-[color:var(--color-text)] border border-[color:var(--color-muted)] focus:border-[color:var(--color-accent)] focus:outline-none text-sm"
            >
              <option value={10} className="text-black">
                10 por página
              </option>
              <option value={25} className="text-black">
                25 por página
              </option>
              <option value={50} className="text-black">
                50 por página
              </option>
              <option value={100} className="text-black">
                100 por página
              </option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 text-gray-500 text-sm">
            <span>
              Mostrando {paginatedData.length} de {filteredAndSortedData.length} resultados
              {searchTerm && ` (filtrado de ${data.length} total)`}
            </span>

            {(searchTerm || filterGrupo !== "todos" || filterEstado !== "todos" || filterRol !== "todos" || selectedAssessment) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterGrupo("todos");
                  setFilterEstado("todos");
                  setFilterRol("todos");
                  setSelectedAssessment("");
                }}
                className="text-[color:var(--color-accent)] hover:text-gray-500 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">Rangos de clasificación</p>
                <p className="text-xs text-gray-500">
                  Ajusta los mínimos para cada estado. No se guardan en la base.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full sm:w-auto">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  Grupo
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={classificationRanges.group}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isNaN(next)) {
                        setClassificationRanges((prev) => normalizeRanges({ ...prev, group: next }));
                      }
                    }}
                    className="w-20 px-2 py-1 rounded-md border border-gray-300 text-gray-900 focus:border-[color:var(--color-accent)] focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  Entrevista
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={classificationRanges.interview}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isNaN(next)) {
                        setClassificationRanges((prev) => normalizeRanges({ ...prev, interview: next }));
                      }
                    }}
                    className="w-20 px-2 py-1 rounded-md border border-gray-300 text-gray-900 focus:border-[color:var(--color-accent)] focus:outline-none"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  Discusión
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={classificationRanges.discussion}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (!Number.isNaN(next)) {
                        setClassificationRanges((prev) => normalizeRanges({ ...prev, discussion: next }));
                      }
                    }}
                    className="w-20 px-2 py-1 rounded-md border border-gray-300 text-gray-900 focus:border-[color:var(--color-accent)] focus:outline-none"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vista móvil */}
      <div className="block lg:hidden w-full max-w-md space-y-4">
        {paginatedData.map((item) => (
          <div
            key={item.ID}
            className="bg-white shadow rounded-xl p-4 text-gray-900 animate-fadeIn border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <img
                src={item.Foto && item.Foto.trim() !== "" ? item.Foto : FOTO_PLACEHOLDER}
                alt={item.Participante}
                className="w-16 h-16 rounded-full object-cover border-2 border-[color:var(--color-accent)] shadow"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== FOTO_PLACEHOLDER) {
                    target.src = FOTO_PLACEHOLDER;
                  }
                }}
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500">ID {item.ID}</p>
                <p className="font-bold text-base truncate">{item.Participante}</p>
                <p className="text-sm text-gray-500 truncate">{item.Correo}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-base mb-3">
              <p>
                <span className="font-bold">Rol:</span>{" "}
                {item.role === "1" ? "Infiltrado" : item.role === "0" ? "Aspirante" : item.role}
              </p>
              <p>
                <span className="font-bold">Grupo:</span> {item.Grupo}
              </p>
            </div>

            <div className="grid grid-cols-5 gap-1 text-sm text-center mb-3">
              <div>
                <span className="block text-gray-400">B1</span>
                {item.Calificacion_Base_1?.toFixed(1) ?? "-"}
              </div>
              <div>
                <span className="block text-gray-400">B2</span>
                {item.Calificacion_Base_2?.toFixed(1) ?? "-"}
              </div>
              <div>
                <span className="block text-gray-400">B3</span>
                {item.Calificacion_Base_3?.toFixed(1) ?? "-"}
              </div>
              <div>
                <span className="block text-gray-400">B4</span>
                {item.Calificacion_Base_4?.toFixed(1) ?? "-"}
              </div>
              <div>
                <span className="block text-gray-400">B5</span>
                {item.Calificacion_Base_5?.toFixed(1) ?? "-"}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-sm">Promedio: </span>
                <span className="font-bold">{item.Calificacion_Promedio?.toFixed(2) ?? "N/A"}</span>
                <span className={`ml-2 text-xs ${getEstadoInfo(item.Calificacion_Promedio).color}`}>
                  {getEstadoInfo(item.Calificacion_Promedio).texto}
                </span>
              </div>

              <button
                className="bg-[color:var(--color-accent)] text-white px-4 py-2 rounded text-base hover:bg-[#5B21B6] transition shadow"
                onClick={() => {
                  setEditModal({ ...item });
                  setOriginalData({ ...item });
                }}
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vista desktop: tabla */}
      <div className="hidden lg:block overflow-x-auto w-full max-w-7xl rounded-2xl bg-white shadow-lg border border-gray-100">
        <table className="min-w-full border-collapse rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-[color:var(--color-accent)] text-white">
              <th className="p-2 sm:p-3 text-left text-sm">ID</th>
              <th className="p-2 sm:p-3 text-left text-sm">Foto</th>
              <th className="p-2 sm:p-3 text-left text-sm">Nombre</th>
              <th className="p-2 sm:p-3 text-left text-sm">Correo</th>
              <th className="p-2 sm:p-3 text-left text-sm">Rol</th>
              <th className="p-2 sm:p-3 text-left text-sm">Grupo</th>
              <th className="p-2 sm:p-3 text-left text-sm">B1</th>
              <th className="p-2 sm:p-3 text-left text-sm">B2</th>
              <th className="p-2 sm:p-3 text-left text-sm">B3</th>
              <th className="p-2 sm:p-3 text-left text-sm">B4</th>
              <th className="p-2 sm:p-3 text-left text-sm">B5</th>
              <th className="p-2 sm:p-3 text-left text-sm">Promedio</th>
              <th className="p-2 sm:p-3 text-left text-sm">Estado</th>
              <th className="p-2 sm:p-3 text-left text-sm">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.map((item) => (
              <tr
                key={item.ID}
                onClick={() => setDetailModal({ ...item })}
                className="border-b border-gray-100 hover:bg-gray-50 transition text-gray-900 bg-white animate-fadeIn cursor-pointer"
              >
                <td className="p-2 font-semibold text-gray-700">{item.ID}</td>
                <td className="p-2">
                  <img
                    src={item.Foto && item.Foto.trim() !== "" ? item.Foto : FOTO_PLACEHOLDER}
                    alt={item.Participante}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[color:var(--color-accent)] shadow"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== FOTO_PLACEHOLDER) {
                        target.src = FOTO_PLACEHOLDER;
                      }
                    }}
                  />
                </td>
                <td className="p-2 font-semibold text-base">{item.Participante}</td>
                <td className="p-2 text-base">{item.Correo}</td>
                <td className="p-2 text-base">
                  {item.role === "1" ? "Infiltrado" : item.role === "0" ? "Aspirante" : item.role}
                </td>
                <td className="p-2 text-base">{item.Grupo}</td>

                <td className="p-2 text-center text-base">
                  {item.Calificacion_Base_1 != null ? item.Calificacion_Base_1.toFixed(2) : "-"}
                </td>
                <td className="p-2 text-center text-base">
                  {item.Calificacion_Base_2 != null ? item.Calificacion_Base_2.toFixed(2) : "-"}
                </td>
                <td className="p-2 text-center text-base">
                  {item.Calificacion_Base_3 != null ? item.Calificacion_Base_3.toFixed(2) : "-"}
                </td>
                <td className="p-2 text-center text-base">
                  {item.Calificacion_Base_4 != null ? item.Calificacion_Base_4.toFixed(2) : "-"}
                </td>
                <td className="p-2 text-center text-base">
                  {item.Calificacion_Base_5 != null ? item.Calificacion_Base_5.toFixed(2) : "-"}
                </td>

                <td className="p-2 font-bold text-center text-base">
                  {item.Calificacion_Promedio != null ? item.Calificacion_Promedio.toFixed(2) : "N/A"}
                </td>

                <td className="p-2 font-bold text-center text-base">
                  <span className={getEstadoInfo(item.Calificacion_Promedio).color}>
                    {getEstadoInfo(item.Calificacion_Promedio).texto}
                  </span>
                </td>

                <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="bg-[color:var(--color-accent)] text-white px-4 py-2 rounded text-base hover:bg-[#5B21B6] transition shadow"
                    onClick={() => {
                      setEditModal({ ...item });
                      setOriginalData({ ...item });
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="w-full max-w-7xl mt-4 px-1 sm:px-2">
          <div className="flex flex-wrap justify-center items-center gap-2 bg-white rounded-xl p-3 border border-gray-100 shadow">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              ««
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              «
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, index, arr) => (
                <span key={page} className="flex items-center">
                  {index > 0 && arr[index - 1] !== page - 1 && <span className="text-gray-400 px-1">...</span>}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded text-sm sm:text-base transition ${
                      currentPage === page
                        ? "bg-[color:var(--color-accent)] text-white font-bold"
                        : "bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white"
                    }`}
                  >
                    {page}
                  </button>
                </span>
              ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              »
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 text-gray-900 hover:bg-[color:var(--color-accent)] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              »»
            </button>
          </div>
        </div>
      )}

      {/* Modal detalle del participante */}
      {detailModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border-2 border-[color:var(--color-accent)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[color:var(--color-accent)] text-white px-4 py-3 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-lg font-bold">Detalle del participante</h2>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                className="text-white hover:bg-white/20 rounded-full p-1 text-2xl leading-none"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-row gap-6 items-start">
                <img
                  src={detailModal.Foto && detailModal.Foto.trim() !== "" ? detailModal.Foto : FOTO_PLACEHOLDER}
                  alt={detailModal.Participante}
                  className="w-44 h-44 sm:w-52 sm:h-52 rounded-full object-cover border-4 border-[color:var(--color-accent)] shadow-lg shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== FOTO_PLACEHOLDER) target.src = FOTO_PLACEHOLDER;
                  }}
                />
                <div className="min-w-0 flex-1 space-y-3">
                  <h3 className="text-xl font-bold text-gray-900">{detailModal.Participante}</h3>
                  <p className="text-gray-600 text-sm">{detailModal.Correo}</p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-900">
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase">ID participante</dt>
                  <dd className="font-medium">{detailModal.ID}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase">Rol</dt>
                  <dd className="font-medium">
                    {detailModal.role === "1" ? "Infiltrado" : detailModal.role === "0" ? "Aspirante" : detailModal.role}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase">Grupo</dt>
                  <dd className="font-medium">{detailModal.Grupo}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase">Promedio</dt>
                  <dd className="font-medium">
                    {detailModal.Calificacion_Promedio != null
                      ? detailModal.Calificacion_Promedio.toFixed(2)
                      : "N/A"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-gray-500 uppercase">Estado</dt>
                  <dd>
                    <span className={getEstadoInfo(detailModal.Calificacion_Promedio).color}>
                      {getEstadoInfo(detailModal.Calificacion_Promedio).texto}
                    </span>
                  </dd>
                </div>
                  </dl>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Calificaciones por base</p>
                <div className="grid grid-cols-5 gap-2">
                  {([1, 2, 3, 4, 5] as const).map((i) => {
                    const key = `Calificacion_Base_${i}` as keyof Calificacion;
                    const val = detailModal[key];
                    return (
                      <div key={i} className="bg-gray-50 rounded-lg p-2 text-center">
                        <span className="text-xs text-gray-500 block">B{i}</span>
                        <span className="font-semibold text-gray-900">
                          {val != null ? Number(val).toFixed(2) : "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailModal(null)}
                  className="px-4 py-2 rounded-lg bg-[color:var(--color-accent)] text-white font-medium hover:bg-[#5B21B6] transition"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para editar */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-primary-dark rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">Editar Participante</h2>

            <form onSubmit={handleUpdate}>
              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Nombre</label>
              <input
                type="text"
                value={editModal.Participante}
                onChange={(e) => setEditModal({ ...editModal, Participante: e.target.value })}
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white placeholder-gray-500 text-sm sm:text-base"
              />

              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Correo</label>
              <input
                type="email"
                value={editModal.Correo}
                onChange={(e) => setEditModal({ ...editModal, Correo: e.target.value })}
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white placeholder-gray-500 text-sm sm:text-base"
              />

              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Rol</label>
              <select
                value={editModal.role}
                onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white text-sm sm:text-base"
              >
                <option value="0">Aspirante</option>
                <option value="1">Infiltrado</option>
              </select>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditModal(null);
                    setOriginalData(null);
                  }}
                  className="px-3 sm:px-4 py-2 rounded bg-white/80 text-black hover:bg-white text-sm sm:text-base"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 rounded bg-success text-white hover:bg-success-dark text-sm sm:text-base"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModalComponent />
    </div>
  );
}
