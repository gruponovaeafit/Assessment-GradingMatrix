import React from 'react';
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
  return (
    <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
      <Box className="p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900 text-center sm:text-left">Buscar y editar Staff</h2>
        
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[color:var(--color-accent)] focus:outline-none transition text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Filtrar por Rol</label>
            <select
              value={filterRol}
              onChange={(e) => { setFilterRol(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-base focus:ring-2 focus:ring-purple-200 outline-none transition"
            >
              <option value="todos">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="calificador">Calificador</option>
              <option value="registrador">Registrador</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-500 ml-1">Ordenar por</label>
            <div className="flex gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "nombre" | "rol")}
                className="flex-1 px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm focus:ring-2 focus:ring-purple-200 outline-none transition"
              >
                <option value="nombre">Por Correo</option>
                <option value="rol">Por Rol</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="px-3 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition"
                title={sortOrder === "asc" ? "Ascendente" : "Descendente"}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>
      </Box>
    </div>
  );
};
