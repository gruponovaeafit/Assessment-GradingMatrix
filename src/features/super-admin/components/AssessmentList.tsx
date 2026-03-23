import React from 'react';
import { type Assessment, type GrupoEstudiantil, type AdminUser } from '../schemas/superAdminSchemas';
import { AssessmentCard } from './AssessmentCard';

interface AssessmentListProps {
  assessments: Assessment[];
  gruposEstudiantiles: GrupoEstudiantil[];
  admins: AdminUser[];
  assessmentEdits: Record<number, { descripcion: string; activo: boolean; grupoId: string }>;
  setAssessmentEdits: React.Dispatch<React.SetStateAction<Record<number, { descripcion: string; activo: boolean; grupoId: string }>>>;
  onUpdate: (id: number) => void;
  loading: boolean;
  handleSwitchAssessment: (assessmentId: number) => Promise<void>;
  openEditModal?: (assessment: Assessment) => void;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  gruposEstudiantiles,
  admins,
  assessmentEdits,
  setAssessmentEdits,
  onUpdate,
  loading,
  handleSwitchAssessment,
  openEditModal,
}) => {
  if (assessments.length === 0) {
    return (
      <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
        No se encontraron assessments con los filtros actuales.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-6">
      {assessments.map((assessment) => {
        const edit = assessmentEdits[assessment.id];
        if (!edit) return null;

        // Find the admin assigned to this assessment
        const admin = admins.find(a => a.assessmentId === assessment.id);

        return (
          <AssessmentCard
            key={assessment.id}
            assessment={assessment}
            adminEmail={admin?.correo}
            onSwitch={() => handleSwitchAssessment(assessment.id)}
            onEdit={() => openEditModal && openEditModal(assessment)}
            loading={loading}
          />
        );
      })}
    </div>
  );
};
