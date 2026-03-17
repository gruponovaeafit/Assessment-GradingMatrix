import React from 'react';
import { type Assessment, type Participant, type Group } from '../schemas/configSchemas';

interface AssignGroupFormProps {
  assessmentId: string;
  setAssessmentId: (val: string) => void;
  selectedParticipant: string;
  setSelectedParticipant: (val: string) => void;
  selectedGroup: string;
  setSelectedGroup: (val: string) => void;
  visibleAssessments: Assessment[];
  participants: Participant[];
  groups: Group[];
  assigningGroup: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const AssignGroupForm: React.FC<AssignGroupFormProps> = ({
  assessmentId,
  setAssessmentId,
  selectedParticipant,
  setSelectedParticipant,
  selectedGroup,
  setSelectedGroup,
  visibleAssessments,
  participants,
  groups,
  assigningGroup,
  onSubmit,
}) => {
  return (
    <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
      <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Asignar Participante a Grupo</h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={assessmentId}
            onChange={(e) => setAssessmentId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
          >
            <option value="">Assessment</option>
            {visibleAssessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.nombre}
              </option>
            ))}
          </select>
          <select
            value={selectedParticipant}
            onChange={(e) => setSelectedParticipant(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
          >
            <option value="">Participante</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>
                {participant.nombre} ({participant.correo})
              </option>
            ))}
          </select>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
          >
            <option value="">Grupo</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.nombre}
              </option>
            ))}
          </select>
          <div className="sm:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={assigningGroup}
              className="px-4 py-2 rounded-lg bg-success hover:bg-success-dark text-white text-sm font-medium transition disabled:opacity-60"
            >
              {assigningGroup ? "Asignando..." : "Asignar a Grupo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
