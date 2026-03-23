import React, { useState } from 'react';
import { type Group, type Participant } from '../schemas/configSchemas';
import { authFetch } from '@/lib/auth/authFetch';
import { showToast } from '@/components/UI/Toast';
import { Spinner } from '@/components/UI/Loading';
import { Trash2, UserMinus, UserPlus, MoveHorizontal, Ghost } from 'lucide-react';

interface EditGroupsFormProps {
  groups: Group[];
  participants: Participant[];
  assessmentId: number;
  onRefresh: () => void;
  logout: () => void;
}

export const EditGroupsForm: React.FC<EditGroupsFormProps> = ({
  groups,
  participants,
  assessmentId,
  onRefresh,
  logout,
}) => {
  const [processingId, setProcessingId] = useState<string | number | null>(null);

  const handleDeleteGroup = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este grupo? Los participantes quedarán sin grupo.')) {
      return;
    }

    setProcessingId(`group-${id}`);
    try {
      const response = await authFetch(
        '/api/assessment/delete-group',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        },
        () => logout()
      );

      if (response.ok) {
        showToast.success('Grupo eliminado');
        onRefresh();
      } else {
        const result = await response.json();
        showToast.error(result.error || 'Error al eliminar grupo');
      }
    } catch (err) {
      showToast.error('Error de red al eliminar grupo');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMoveParticipant = async (participantId: number, newGroupId: number | null) => {
    setProcessingId(`part-${participantId}`);
    try {
      const response = await authFetch(
        '/api/participante/assign-group',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assessmentId,
            participanteId: participantId,
            grupoAssessmentId: newGroupId,
          }),
        },
        () => logout()
      );

      if (response.ok) {
        showToast.success('Cambio realizado');
        onRefresh();
      } else {
        const result = await response.json();
        showToast.error(result.error || 'Error al mover participante');
      }
    } catch (err) {
      showToast.error('Error de red al mover participante');
    } finally {
      setProcessingId(null);
    }
  };

  // Organizar participantes por grupo
  const participantsByGroup = groups.reduce((acc, group) => {
    acc[group.id] = participants.filter(p => p.grupoId === group.id);
    return acc;
  }, {} as Record<number, Participant[]>);

  const unassignedParticipants = participants.filter(p => !p.grupoId);

  return (
    <div className="space-y-6">
      {/* Sección de Participantes sin Grupo */}
      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
        <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Participantes sin grupo ({unassignedParticipants.length})
        </h3>
        {unassignedParticipants.length === 0 ? (
          <p className="text-xs text-orange-600 italic">Todos los participantes tienen grupo.</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
            {unassignedParticipants.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-orange-200 text-xs">
                <div className="flex items-center gap-2 truncate mr-2">
                  <span className="font-bold text-gray-900 truncate max-w-[150px]">{p.nombre}</span>
                  {p.isImpostor && (
                    <span title="Impostor">
                      <Ghost className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                    </span>
                  )}
                </div>
                <select 
                  onChange={(e) => handleMoveParticipant(p.id, Number(e.target.value))}
                  disabled={processingId === `part-${p.id}`}
                  className="bg-orange-100 text-orange-800 border-none rounded px-2 py-1 font-bold outline-none focus:ring-1 focus:ring-orange-400"
                  value=""
                >
                  <option value="" disabled>Asignar a...</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.nombre}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Grupos */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Grupos Existentes</h3>
        {groups.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400 text-sm">
            No hay grupos creados. Usa "Crear y sortear".
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {groups.map((group) => (
              <div 
                key={group.id} 
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
              >
                {/* Header del Grupo */}
                <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                      {group.nombre.match(/\d+/)?.[0] || group.nombre.charAt(0)}
                    </div>
                    <span className="font-bold text-gray-900">{group.nombre}</span>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {participantsByGroup[group.id]?.length || 0} integrantes
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    disabled={processingId === `group-${group.id}`}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition"
                    title="Eliminar grupo"
                  >
                    {processingId === `group-${group.id}` ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Lista de Integrantes */}
                <div className="p-3 space-y-2">
                  {(participantsByGroup[group.id] || []).length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic text-center py-2">Sin integrantes</p>
                  ) : (
                    participantsByGroup[group.id].map(p => (
                      <div key={p.id} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-2 truncate mr-2">
                          <span className="text-xs font-semibold text-gray-900 truncate max-w-[180px]">{p.nombre}</span>
                          {p.isImpostor && (
                            <span title="Impostor">
                              <Ghost className="w-3 h-3 text-purple-400 flex-shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                          <select 
                            onChange={(e) => handleMoveParticipant(p.id, e.target.value === "none" ? null : Number(e.target.value))}
                            disabled={processingId === `part-${p.id}`}
                            className="text-[10px] bg-gray-100 hover:bg-purple-100 text-gray-600 border-none rounded px-1.5 py-0.5 outline-none"
                            value={group.id}
                          >
                            <option value="none">Desvincular</option>
                            <optgroup label="Mover a...">
                              {groups.filter(g => g.id !== group.id).map(g => (
                                <option key={g.id} value={g.id}>{g.nombre}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
