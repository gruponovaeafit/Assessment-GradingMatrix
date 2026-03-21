import React from 'react';
import { RefreshCw, SlidersHorizontal, Download, Search, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Spinner } from '@/components/UI/Loading';

interface GestionToolbarProps {
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
        <div className="flex flex-wrap items-center gap-3">          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50 group"
          >
            {loading ? <Spinner size="sm" color="primary" /> : (
              <RefreshCw className={`w-4 h-4 transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180 duration-500'}`} />
            )}
            Actualizar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenRanges}
            className="bg-gray-800 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 group"
          >
            <SlidersHorizontal className="w-4 h-4 transition-transform group-hover:scale-110" />
            Rangos
          </button>
          <button
            onClick={onExport}
            disabled={exporting}
            className="bg-success hover:bg-success-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 disabled:opacity-50 group"
          >
            {exporting ? <Spinner size="sm" color="white" /> : (
              <Download className="w-4 h-4 transition-transform group-hover:-translate-y-1" />
            )}
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Fila inferior: Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Search className="w-4 h-4" />
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
          <option value="Pasa al grupo">Pasa al grupo</option>
          <option value="Pasa a entrevista">Pasa a entrevista</option>
          <option value="Pasa a discusión">Pasa a discusión</option>
          <option value="No pasa">No pasa</option>
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
                {sortOrder === "asc" ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
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
                className="text-[color:var(--color-accent)] hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Limpiar filtros
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
