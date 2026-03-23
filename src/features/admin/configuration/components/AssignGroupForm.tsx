import React from 'react';
import { type Participant, type Group } from '../schemas/configSchemas';
import { Box } from '@/components/UI/Box';
import { Button } from '@/components/UI/Button';

interface AssignGroupFormProps {
  selectedParticipant: string;
  setSelectedParticipant: (val: string) => void;
  selectedGroup: string;
  setSelectedGroup: (val: string) => void;
  participants: Participant[];
  groups: Group[];
  assigningGroup: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const AssignGroupForm: React.FC<AssignGroupFormProps> = ({
  selectedParticipant,
  setSelectedParticipant,
  selectedGroup,
  setSelectedGroup,
  participants,
  groups,
  assigningGroup,
  onSubmit,
}) => {
  return (
    <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
      <Box className="p-4 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Asignar Participante a Grupo</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-base font-semibold text-gray-700">Participante</label>
              <select
                value={selectedParticipant}
                onChange={(e) => setSelectedParticipant(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              >
                <option value="">Seleccionar Participante</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.nombre} ({participant.correo})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-base font-semibold text-gray-700">Grupo</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              >
                <option value="">Seleccionar Grupo</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <Button
              type="submit"
              loading={assigningGroup}
              variant="success"
              className="px-8 py-3"
            >
              Asignar a Grupo
            </Button>
          </div>
        </form>
      </Box>
    </div>
  );
};
