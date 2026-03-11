import React from 'react';
import { Spinner } from '@/components/UI/Loading';
import { type Assessment } from '../schemas/gestionSchemas';

interface GestionToolbarProps {
  assessments: Assessment[];
  selectedAssessment: string;
  setSelectedAssessment: (val: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterGrupo: string;
  setFilterGrupo: (val: string) => void;
  filterEstado: string;
  setFilterEstado: (val: string) => void;
  filterRol: string;
  setFilterRol: (val: string) => void;
  sortBy: string;
  setSortBy: (val: any) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (val: "asc" | "desc") => void;
  itemsPerPage: number;
  setItemsPerPage: (val: number) => void;
  onRefresh: () => void;
  onExport: () => void;
  onOpenRanges: () => void;
  grupos: string[];
  loading: boolean;
  exporting: boolean;
}

export const GestionToolbar: React.FC<GestionToolbarProps> = ({
  assessments,
  selectedAssessment,
  setSelectedAssessment,
  searchTerm,
  setSearchTerm,
  filterGrupo,
  setFilterGrupo,
  filterEstado,
  setFilterEstado,
  filterRol,
  setFilterRol,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  itemsPerPage,
  setItemsPerPage,
  onRefresh,
  onExport,
  onOpenRanges,
  grupos,
  loading,
  exporting,
}) => {
  return (
    <div className="w-full max-w-7xl space-y-4 mb-6">
      {/* Fila superior: Acciones Principales */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedAssessment}
            onChange={(e) => setSelectedAssessment(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none"
          >
            <option value="">Assessment: Por defecto</option>
            {assessments.map((a) => (
              <option key={a.id} value={String(a.id)}>
                {a.nombre}
              </option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" color="primary" /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Actualizar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenRanges}
            className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Rangos
          </button>
          <button
            onClick={onExport}
            disabled={exporting}
            className="bg-success hover:bg-success-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Spinner size="sm" color="white" /> : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Fila inferior: Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm"
          />
        </div>

        <select
          value={filterGrupo}
          onChange={(e) => setFilterGrupo(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm"
        >
          <option value="todos">Todos los grupos</option>
          {grupos.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={filterEstado}
          onChange={(e) => setFilterEstado(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm"
        >
          <option value="todos">Todos los estados</option>
          <option value="✅ Pasa al grupo">✅ Pasa al grupo</option>
          <option value="📋 Pasa a entrevista">📋 Pasa a entrevista</option>
          <option value="⚠️ Pasa a discusión">⚠️ Pasa a discusión</option>
          <option value="❌ No pasa">❌ No pasa</option>
          <option value="Pendiente">Pendiente</option>
        </select>

        <select
          value={filterRol}
          onChange={(e) => setFilterRol(e.target.value)}
          className="px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm"
        >
          <option value="todos">Todos los roles</option>
          <option value="aspirante">Aspirantes</option>
          <option value="infiltrado">Infiltrados</option>
        </select>

        <div className="lg:col-span-5 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ordenar:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-sm font-semibold text-gray-700 outline-none cursor-pointer"
              >
                <option value="nombre">Nombre</option>
                <option value="promedio">Promedio</option>
                <option value="grupo">Grupo</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="p-1 hover:bg-gray-100 rounded transition"
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-transparent text-sm font-semibold text-gray-700 outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            {searchTerm || filterGrupo !== "todos" || filterEstado !== "todos" || filterRol !== "todos" ? (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterGrupo("todos");
                  setFilterEstado("todos");
                  setFilterRol("todos");
                }}
                className="text-[color:var(--color-accent)] hover:underline"
              >
                Limpiar filtros
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
