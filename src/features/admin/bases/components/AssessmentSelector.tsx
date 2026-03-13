import React from 'react';
import { type Assessment } from '../schemas/basesSchemas';

interface AssessmentSelectorProps {
  assessments: Assessment[];
  selectedAssessment: string;
  onAssessmentChange: (value: string) => void;
  onOpenCreate: () => void;
}

export const AssessmentSelector: React.FC<AssessmentSelectorProps> = ({
  assessments,
  selectedAssessment,
  onAssessmentChange,
  onOpenCreate,
}) => {
  return (
    <>
      <div className="w-full max-w-[1200px] mb-6 px-1 sm:px-2">
        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Selecciona un Assessment
          </label>
          <select
            value={selectedAssessment}
            onChange={(e) => onAssessmentChange(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-base"
          >
            <option value="">-- Selecciona un assessment --</option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.nombre} (ID: {assessment.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedAssessment && (
        <div className="w-full max-w-[1200px] mb-4 px-1 sm:px-2">
          <button
            onClick={onOpenCreate}
            className="w-full sm:w-auto bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-6 py-3 rounded-lg font-semibold transition shadow"
          >
            + Crear Nueva Base
          </button>
        </div>
      )}
    </>
  );
};
