import React from 'react';
import { type Assessment } from '../schemas/configSchemas';

interface ParticipantFiltersBarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  filterAssessment: string;
  setFilterAssessment: (val: string) => void;
  filterGrupo: string;
  setFilterGrupo: (val: string) => void;
  filterRol: string;
  setFilterRol: (val: string) => void;
  sortBy: "nombre" | "promedio" | "grupo";
  setSortBy: (val: "nombre" | "promedio" | "grupo") => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (val: "asc" | "desc") => void;
  visibleAssessments: Assessment[];
  grupos: string[];
  onFetchData: (assessmentId: string) => void;
  setCurrentPage: (val: number) => void;
}

export const ParticipantFiltersBar: React.FC<ParticipantFiltersBarProps> = ({
  searchTerm,
  setSearchTerm,
  filterAssessment,
  setFilterAssessment,
  filterGrupo,
  setFilterGrupo,
  filterRol,
  setFilterRol,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  visibleAssessments,
  grupos,
  onFetchData,
  setCurrentPage,
}) => {
  return (
    <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
      <div className="bg-white rounded-xl p-4 space-y-3 shadow border border-gray-100">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[color:var(--color-accent)] focus:outline-none transition text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <select
            value={filterAssessment}
            onChange={(e) => {
              const value = e.target.value;
              setFilterAssessment(value);
              setCurrentPage(1);
              onFetchData(value);
            }}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-base"
          >
            <option value="default">Assessment por defecto</option>
            {visibleAssessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.nombre}
              </option>
            ))}
          </select>

          <select
            value={filterGrupo}
            onChange={(e) => setFilterGrupo(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-base"
          >
            <option value="todos">Todos los grupos</option>
            {grupos.map((grupo) => (
              <option key={grupo} value={grupo}>{grupo}</option>
            ))}
          </select>

          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-base"
          >
            <option value="todos">Todos los roles</option>
            <option value="0">Participante (0)</option>
            <option value="1">Impostor (1)</option>
          </select>

          <div className="flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="flex-1 px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
            >
              <option value="nombre">Por Nombre</option>
              <option value="promedio">Por Promedio</option>
              <option value="grupo">Por Grupo</option>
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
    </div>
  );
};
