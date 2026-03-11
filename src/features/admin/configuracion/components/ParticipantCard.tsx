import React from 'react';
import { type Calificacion } from '../schemas/configSchemas';
import { Pencil, User, Mail, Users, Activity, GraduationCap } from 'lucide-react';

/**
 * ParticipantCard - Individual Config View Card
 * 
 * This component renders a single participant card for the 'configuracion' view.
 * Unlike the 'gestion' CardList, this is used to display and edit base settings.
 * 
 * @see src/features/admin/gestion/components/ParticipantCardList.tsx for the mobile management view.
 */
interface ParticipantCardProps {
  participant: Calificacion;
  onEdit: (participant: Calificacion) => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({ participant, onEdit }) => {
  const labelClass = "font-bold text-gray-700 flex items-center gap-2";
  const iconClass = "w-4 h-4 text-[color:var(--color-accent)]";

  return (
    <div
      className="flex flex-col justify-center items-center text-gray-900 px-4 sm:px-6 py-3 sm:py-4 rounded-lg bg-white shadow animate-fadeIn border border-gray-100"
      style={{
        width: '100%',
        maxWidth: '320px',
        minHeight: '260px',
      }}
    >
      <div className="w-full flex justify-center mb-2">
        <h2 className="text-lg font-bold text-[color:var(--color-accent)] text-center w-full leading-tight flex items-center justify-center gap-2">
          <User className="w-5 h-5" />
          {participant.Participante}
        </h2>
      </div>

      <div className="w-full flex justify-center mb-3">
        <div className="border-t border-gray-100" style={{ width: '95%' }} />
      </div>

      <div className="text-left w-full space-y-2 text-sm sm:text-base">
        <p className="flex items-center gap-2">
          <span className={labelClass}><Activity className={iconClass} /> ID:</span> {participant.ID}
        </p>
        <p className="flex items-center gap-2">
          <span className={labelClass}><Users className={iconClass} /> Grupo:</span> {participant.Grupo}
        </p>
        <p className="truncate flex items-center gap-2" title={participant.Correo}>
          <span className={labelClass}><Mail className={iconClass} /> Correo:</span> {participant.Correo}
        </p>
        <p className="flex items-center gap-2">
          <span className={labelClass}><GraduationCap className={iconClass} /> Rol:</span> {participant.role}
        </p>
        <p className="flex items-center gap-2">
          <span className={labelClass}><Activity className={iconClass} /> Promedio:</span>{" "}
          <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-sm">
            {participant.Calificacion_Promedio != null
              ? participant.Calificacion_Promedio.toFixed(2)
              : "Sin calificación"}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <span className={labelClass}><Activity className={iconClass} /> Estado:</span>{' '}
          <span className={`font-bold ${participant.Estado === "Completado" ? 'text-success' : 'text-yellow-500'}`}>
            {participant.Estado}
          </span>
        </p>
      </div>

      <button
        onClick={() => onEdit(participant)}
        className="mt-4 w-full text-base bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg shadow-sm transition flex items-center justify-center gap-2 group"
      >
        <Pencil className="w-4 h-4 transition-transform group-hover:scale-110" />
        Editar
      </button>
    </div>
  );
};
