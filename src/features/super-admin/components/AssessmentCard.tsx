import React from 'react';
import { Button } from '@/components/UI/Button';
import { type Assessment, type GrupoEstudiantil } from '../schemas/superAdminSchemas';
import { calculateSemester } from '../utils/superAdminUtils';

interface AssessmentCardProps {
  assessment: Assessment;
  adminEmail?: string;
  onSwitch: () => Promise<void>;
  onEdit: () => void;
  loading: boolean;
}

export const AssessmentCard: React.FC<AssessmentCardProps> = ({
  assessment,
  adminEmail,
  onSwitch,
  onEdit,
  loading,
}) => {
  const [switching, setSwitching] = React.useState(false);

  const handleSwitch = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSwitching(true);
    await onSwitch();
    setSwitching(false);
  };

  const semester = calculateSemester(assessment.createdAt);

  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 group overflow-hidden cursor-pointer"
      onClick={onEdit}
    >
      {/* Information Layout */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 flex-1 min-w-0">
        
        <div className="flex items-center gap-4 sm:gap-8 shrink-0">
          {/* Status Indicator */}
          <div className="flex items-center justify-center w-6 shrink-0">
            <div className={`w-3 h-3 rounded-full ${assessment.activo ? 'bg-green-500' : 'bg-red-500'}`} title={assessment.activo ? 'Activo' : 'Inactivo'} />
          </div>

          {/* ID */}
          <div className="w-12 shrink-0">
            <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">ID</p>
            <p className="text-sm font-semibold text-gray-700">{assessment.id}</p>
          </div>

          {/* Semester */}
          <div className="w-20 shrink-0">
            <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Periodo</p>
            <p className="text-sm font-semibold text-gray-700">{assessment.periodo || semester}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 flex-1 min-w-0">
          {/* Name */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Assessment</p>
            <p className="text-sm font-bold text-gray-900 truncate" title={assessment.nombre}>
              {assessment.nombre}
            </p>
          </div>

          {/* Group Name */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">Grupo Estudiantil</p>
            <p className="text-sm text-gray-600 truncate" title={assessment.grupoNombre || ""}>
              {assessment.grupoNombre || "Sin grupo asignado"}
            </p>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center w-full md:w-auto shrink-0 mt-2 md:mt-0">
        <Button
          onClick={handleSwitch}
          variant="secondary"
          loading={switching}
          disabled={loading}
          className="w-full md:w-auto whitespace-nowrap"
        >
          Entrar como administrador
        </Button>
      </div>
    </div>
  );
};
