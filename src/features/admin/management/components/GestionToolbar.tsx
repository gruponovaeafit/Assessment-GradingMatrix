import React from 'react';
import { ArrowUp, ArrowDown, Search, X } from 'lucide-react';

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
  grupos: string[];
  loading: boolean;
  exporting: boolean;
  onClearFilters: () => void;
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
  grupos,
  loading,
  exporting,
  onClearFilters,
}) => {
  const hasActiveFilters =
    !!searchTerm ||
    filterGrupo !== "todos" ||
    filterEstado !== "todos" ||
    filterRol !== "todos";

  const clearFilters = () => {
    setSearchTerm("");
    setFilterGrupo("todos");
    setFilterEstado("todos");
    setFilterRol("todos");
  };

  return (
    <div className="w-full space-y-3">
      {/* Búsqueda y filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
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
      </div>

      {/* Fila 3: Ordenar, mostrar, limpiar — altura siempre fija */}
      <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
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
              {sortOrder === "asc"
                ? <ArrowUp className="w-3.5 h-3.5" />
                : <ArrowDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mostrar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none cursor-pointer"
            >
              <option value={10}>10 por página</option>
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>
          </div>
        </div>

        {/* Siempre ocupa espacio — invisible cuando no hay filtros activos */}
        <div className="ml-auto">
          <button
            onClick={onClearFilters}
            className={`flex items-center gap-1 text-xs whitespace-nowrap font-medium px-3 py-1.5 rounded-lg transition
              ${hasActiveFilters
                ? "bg-[color:var(--color-accent)] text-white hover:bg-[#5B21B6]"
                : "bg-gray-300 text-gray-500 cursor-pointer hover:bg-gray-400"
              }`}
          >
            <X className="w-3 h-3 shrink-0" />
            Limpiar filtros
          </button>
          
        </div>
      </div>
    </div>
  );
};