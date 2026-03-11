import React from 'react';
import { 
  Users, 
  Layers, 
  Download, 
  PlusCircle, 
  Search, 
  Filter,
  Calendar,
  Building
} from 'lucide-react';

interface SuperAdminToolbarProps {
  // Bulk Actions
  onBulkAssessments: () => void;
  onBulkAdmins: () => void;
  onExportAdmins: () => void;
  loadingBulkAssessments: boolean;
  loadingBulkAdmins: boolean;

  // Assessment Filters
  assessmentSearch: string;
  setAssessmentSearch: (val: string) => void;
  assessmentFilter: "activos" | "inactivos" | "todos";
  setAssessmentFilter: (val: "activos" | "inactivos" | "todos") => void;
  assessmentGroupFilter: string;
  setAssessmentGroupFilter: (val: string) => void;
  assessmentYearFilter: string;
  setAssessmentYearFilter: (val: string) => void;

  // Admin Filters
  adminSearch: string;
  setAdminSearch: (val: string) => void;
  adminFilter: "activos" | "todos";
  setAdminFilter: (val: "activos" | "todos") => void;
  adminGroupFilter: string;
  setAdminGroupFilter: (val: string) => void;
  adminYearFilter: string;
  setAdminYearFilter: (val: string) => void;

  // Options
  uniqueGroups: string[];
  uniqueYears: string[];
  gruposEstudiantiles: { id: number; nombre: string }[];
}

export const SuperAdminToolbar: React.FC<SuperAdminToolbarProps> = ({
  onBulkAssessments,
  onBulkAdmins,
  onExportAdmins,
  loadingBulkAssessments,
  loadingBulkAdmins,
  assessmentSearch,
  setAssessmentSearch,
  assessmentFilter,
  setAssessmentFilter,
  assessmentGroupFilter,
  setAssessmentGroupFilter,
  assessmentYearFilter,
  setAssessmentYearFilter,
  adminSearch,
  setAdminSearch,
  adminFilter,
  setAdminFilter,
  adminGroupFilter,
  setAdminGroupFilter,
  adminYearFilter,
  setAdminYearFilter,
  uniqueGroups,
  uniqueYears,
  gruposEstudiantiles
}) => {
  const selectClass = "px-3 py-2 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm text-gray-900";
  const inputClass = "w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm text-gray-900";

  return (
    <div className="space-y-6 mb-8">
      {/* Mass Actions Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-[color:var(--color-accent)]" />
          Acciones Masivas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={onBulkAssessments}
            disabled={loadingBulkAssessments}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[color:var(--color-accent)] text-[color:var(--color-accent)] font-bold hover:bg-[color:var(--color-accent)] hover:text-white transition disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            Crear Assessments (Todos)
          </button>
          <button
            onClick={onBulkAdmins}
            disabled={loadingBulkAdmins}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-[color:var(--color-accent)] text-[color:var(--color-accent)] font-bold hover:bg-[color:var(--color-accent)] hover:text-white transition disabled:opacity-50"
          >
            <Users className="w-4 h-4" />
            Crear Admins (Activos)
          </button>
          <button
            onClick={onExportAdmins}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-success text-white font-bold hover:bg-success-dark shadow-md shadow-green-100 transition"
          >
            <Download className="w-4 h-4" />
            Exportar Admins CSV
          </button>
        </div>
      </div>

      {/* Filter Sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Assessment Filters */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-500" />
            Filtros de Assessments
          </h2>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={assessmentSearch}
                onChange={(e) => setAssessmentSearch(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={assessmentFilter}
                onChange={(e) => setAssessmentFilter(e.target.value as any)}
                className={selectClass}
              >
                <option value="activos">Solo Activos</option>
                <option value="inactivos">Solo Inactivos</option>
                <option value="todos">Todos los Estados</option>
              </select>
              <select
                value={assessmentGroupFilter}
                onChange={(e) => setAssessmentGroupFilter(e.target.value)}
                className={selectClass}
              >
                <option value="todos">Todos los Grupos</option>
                {gruposEstudiantiles.map(g => (
                  <option key={g.id} value={String(g.id)}>{g.nombre}</option>
                ))}
              </select>
              <select
                value={assessmentYearFilter}
                onChange={(e) => setAssessmentYearFilter(e.target.value)}
                className={selectClass}
              >
                <option value="todos">Todos los Años</option>
                {uniqueYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Admin Filters */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-500" />
            Filtros de Administradores
          </h2>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por correo o assessment..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={adminFilter}
                onChange={(e) => setAdminFilter(e.target.value as any)}
                className={selectClass}
              >
                <option value="activos">Con Assessment Activo</option>
                <option value="todos">Todos los Administradores</option>
              </select>
              <select
                value={adminGroupFilter}
                onChange={(e) => setAdminGroupFilter(e.target.value)}
                className={selectClass}
              >
                <option value="todos">Cualquier Grupo</option>
                {uniqueGroups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <select
                value={adminYearFilter}
                onChange={(e) => setAdminYearFilter(e.target.value)}
                className={selectClass}
              >
                <option value="todos">Cualquier Año</option>
                {uniqueYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper icon since ShieldCheck wasn't imported from lucide-react in the first line but I can add it
import { ShieldCheck } from 'lucide-react';
