import React from 'react';
import { type Assessment } from '../schemas/configSchemas';

interface AssessmentListProps {
  visibleAssessments: Assessment[];
  allAssessmentsCount: number;
  onRefresh: () => void;
  onToggle: (id: number, active: boolean) => void;
  isSuperAdmin: boolean;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  visibleAssessments,
  allAssessmentsCount,
  onRefresh,
  onToggle,
  isSuperAdmin,
}) => {
  return (
    <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
      <div className="bg-white rounded-xl p-4 shadow border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-900">Assessments</h2>
          <button
            onClick={onRefresh}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm hover:bg-gray-50 transition"
          >
            Recargar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleAssessments.map((assessment) => (
            <div key={assessment.id} className="border border-gray-100 rounded-lg p-3 flex items-center justify-between shadow-sm">
              <div>
                <p className="font-semibold text-gray-900">{assessment.nombre}</p>
                <p className="text-xs text-gray-500">ID: {assessment.id}</p>
              </div>
              {isSuperAdmin ? (
                <button
                  onClick={() => onToggle(assessment.id, assessment.activo)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    assessment.activo ? "bg-success text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {assessment.activo ? "Activo" : "Inactivo"}
                </button>
              ) : (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    assessment.activo ? "bg-success text-white" : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {assessment.activo ? "Activo" : "Inactivo"}
                </span>
              )}
            </div>
          ))}
          {allAssessmentsCount === 0 && (
            <p className="text-sm text-gray-500 italic">No hay assessments registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
};
