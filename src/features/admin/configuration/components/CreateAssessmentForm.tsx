import React from 'react';

interface CreateAssessmentFormProps {
  grupoEstudiantilId: string;
  setGrupoEstudiantilId: (val: string) => void;
  assessmentNombre: string;
  setAssessmentNombre: (val: string) => void;
  assessmentDescripcion: string;
  setAssessmentDescripcion: (val: string) => void;
  creatingAssessment: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const CreateAssessmentForm: React.FC<CreateAssessmentFormProps> = ({
  grupoEstudiantilId,
  setGrupoEstudiantilId,
  assessmentNombre,
  setAssessmentNombre,
  assessmentDescripcion,
  setAssessmentDescripcion,
  creatingAssessment,
  onSubmit,
}) => {
  return (
    <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
      <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Crear Assessment</h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="number"
            placeholder="ID GrupoEstudiantil"
            value={grupoEstudiantilId}
            onChange={(e) => setGrupoEstudiantilId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
          />
          <input
            type="text"
            placeholder="Nombre del Assessment"
            value={assessmentNombre}
            onChange={(e) => setAssessmentNombre(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
          />
          <input
            type="text"
            placeholder="Descripción (opcional)"
            value={assessmentDescripcion}
            onChange={(e) => setAssessmentDescripcion(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
          />
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={creatingAssessment}
              className="px-4 py-2 rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-sm font-medium transition disabled:opacity-60"
            >
              {creatingAssessment ? 'Creando...' : 'Crear Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
