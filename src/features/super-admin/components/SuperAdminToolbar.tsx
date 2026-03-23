import React from 'react';
import { Button } from '@/components/UI/Button';
import { 
  PlusCircle, 
  Search, 
} from 'lucide-react';

interface SuperAdminToolbarProps {
  // Bulk Actions
  onBulkAssessments: () => void;
  loadingBulkAssessments: boolean;

  // Assessment Filters
  assessmentSearch: string;
  setAssessmentSearch: (val: string) => void;
  assessmentFilter: "activos" | "inactivos" | "todos";
  setAssessmentFilter: (val: "activos" | "inactivos" | "todos") => void;
  assessmentGroupFilter: string;
  setAssessmentGroupFilter: (val: string) => void;
  assessmentYearFilter: string;
  setAssessmentYearFilter: (val: string) => void;

  // Options
  uniqueGroups: string[];
  uniqueYears: string[];
  gruposEstudiantiles: { id: number; nombre: string }[];
}

export const SuperAdminToolbar: React.FC<SuperAdminToolbarProps> = ({
  onBulkAssessments,
  loadingBulkAssessments,
  assessmentSearch,
  setAssessmentSearch,
  assessmentFilter,
  setAssessmentFilter,
  assessmentGroupFilter,
  setAssessmentGroupFilter,
  assessmentYearFilter,
  setAssessmentYearFilter,
  uniqueGroups,
  uniqueYears,
  gruposEstudiantiles
}) => {
  return (
    <div className="space-y-12">
      {/* Mass Actions Card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Acciones Masivas</h2>
        <p className="text-sm text-gray-400 mb-6">
          Crea assessments y asígnale su administrador (solo hay un administrador por grupo estudiantil)
        </p>
        <Button
          onClick={onBulkAssessments}
          disabled={loadingBulkAssessments}
          className="w-full"
        >
          Crear assessment para todos los grupos
        </Button>
      </div>

      {/* Filter and Table Header are now integrated in SuperAdminContainer, 
          but we provide the filter row here */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar assessment"
            value={assessmentSearch}
            onChange={(e) => setAssessmentSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-base text-gray-900"
          />
        </div>

        <select
          value={assessmentFilter}
          onChange={(e) => setAssessmentFilter(e.target.value as any)}
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-base text-gray-900"
        >
          <option value="activos">Solo activos</option>
          <option value="inactivos">Solo inactivos</option>
          <option value="todos">Todos los estados</option>
        </select>

        <select
          value={assessmentGroupFilter}
          onChange={(e) => setAssessmentGroupFilter(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-base text-gray-900"
        >
          <option value="todos">Todos los grupos</option>
          {gruposEstudiantiles.map((g) => (
            <option key={g.id} value={String(g.id)}>
              {g.nombre}
            </option>
          ))}
        </select>

        <div className="relative">
          <input
            type="text"
            placeholder="Semestre (ej: 2024-1)"
            value={assessmentYearFilter === "todos" ? "" : assessmentYearFilter}
            onChange={(e) => setAssessmentYearFilter(e.target.value || "todos")}
            className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-base text-gray-900"
          />
        </div>
      </div>
    </div>
  );
};
