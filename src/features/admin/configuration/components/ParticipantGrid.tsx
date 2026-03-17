import React from 'react';
import { ParticipantCard } from './ParticipantCard';
import { type Calificacion } from '../schemas/configSchemas';

interface ParticipantGridProps {
  paginatedData: Calificacion[];
  onEdit: (participant: Calificacion) => void;
}

export const ParticipantGrid: React.FC<ParticipantGridProps> = ({ paginatedData, onEdit }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 max-w-[900px] w-full rounded-md p-2 sm:p-4">
      {paginatedData.map((item) => (
        <ParticipantCard key={item.ID} participant={item} onEdit={onEdit} />
      ))}
      {paginatedData.length === 0 && (
        <div className="w-full text-center py-10 text-gray-500 italic">
          No se encontraron participantes con los filtros actuales.
        </div>
      )}
    </div>
  );
};
