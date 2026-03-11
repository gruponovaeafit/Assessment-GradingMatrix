import React from 'react';
import { type Calificacion } from '../schemas/configSchemas';

interface ParticipantCardProps {
  participant: Calificacion;
  onEdit: (participant: Calificacion) => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onEdit }) => {
  return (
    <div
      className="flex flex-col justify-center items-center text-gray-900 px-4 sm:px-6 py-3 sm:py-4 rounded-lg bg-white shadow animate-fadeIn border border-gray-100"
      style={{
        width: '100%',
        maxWidth: '320px',
        minHeight: '240px',
      }}
    >
      <div className="w-full flex justify-center mb-2">
        <h2 className="text-lg font-bold text-[color:var(--color-accent)] text-center w-full leading-tight">
          {participant.Participante}
        </h2>
      </div>

      <div className="w-full flex justify-center mb-2">
        <div className="border-t border-gray-200" style={{ width: '95%' }} />
      </div>

      <div className="text-left w-full leading-5 sm:leading-6 text-base">
        <p><span className="font-bold">ID:</span> {participant.ID}</p>
        <p><span className="font-bold">Grupo:</span> {participant.Grupo}</p>
        <p className="truncate" title={participant.Correo}><span className="font-bold">Correo:</span> {participant.Correo}</p>
        <p><span className="font-bold">Rol:</span> {participant.role}</p>
        <p>
          <span className="font-bold">Promedio:</span>{" "}
          {participant.Calificacion_Promedio != null
            ? participant.Calificacion_Promedio.toFixed(2)
            : "Sin calificación"}
        </p>
        <p>
          <span className="font-bold">Estado:</span>{' '}
          <span className={participant.Estado === "Completado" ? 'text-green-500' : 'text-yellow-500'}>
            {participant.Estado}
          </span>
        </p>
      </div>

      <button
        onClick={() => onEdit(participant)}
        className="mt-2 text-base bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded shadow transition"
      >
        Editar
      </button>
    </div>
  );
};
