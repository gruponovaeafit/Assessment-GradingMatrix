import React from 'react';
import { ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import { notify } from '@/components/UI/Notification';
import { Box } from '@/components/UI/Box';

interface ParticipantFiltersBarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterRol: string;
  setFilterRol: (val: string) => void;
  sortBy: "nombre" | "rol";
  setSortBy: (val: "nombre" | "rol") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (val: "asc" | "desc") => void;
  setCurrentPage: (val: number) => void;
}

export const ParticipantFiltersBar: React.FC<ParticipantFiltersBarProps> = ({
  searchTerm,
  setSearchTerm,
  filterRol,
  setFilterRol,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  setCurrentPage,
}) => {
  const hasActiveFilters = !!searchTerm || filterRol !== "todos";

  const handleClearFilters = () => {
    if (hasActiveFilters) {
      setSearchTerm("");
      setFilterRol("todos");
      setCurrentPage(1);
      notify({
        title: "Filtros limpiados",
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
  };

  return (
    <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
      <Box className="w-full p-4 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4 text-center sm:text-left">Buscar y editar staff</h2>

        {/* Busqueda y filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative lg:col-span-2">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar por correo..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 text-gray-900 border border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm"
            />
          </div>

          <select
            value={filterRol}
            onChange={(e) => { setFilterRol(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-lg bg-gray-50 text-gray-900 border border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm"
          >
            <option value="todos">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="calificador">Calificadores</option>
            <option value="registrador">Registradores</option>
          </select>
        </div>

        {/* Ordenar y limpiar */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "nombre" | "rol")}
              className="bg-transparent text-sm font-semibold text-gray-700 outline-none cursor-pointer"
            >
              <option value="nombre">Correo</option>
              <option value="rol">Rol</option>
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

          <div className="ml-auto">
            <button
              onClick={handleClearFilters}
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
      </Box>
    </div>
  );
};