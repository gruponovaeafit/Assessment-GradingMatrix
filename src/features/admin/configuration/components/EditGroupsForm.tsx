import React, { useState } from 'react';
import { type Group, type Participant } from '../schemas/configSchemas';
import { authFetch } from '@/lib/auth/authFetch';
import { notify } from '@/components/UI/Notification';
import { useConfirmModal } from '@/components/UI/ConfirmModal';
import { Spinner } from '@/components/UI/Loading';
import { Trash2, UserPlus, Ghost } from 'lucide-react';

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
  const { confirm, setIsLoading: setConfirmLoading, ConfirmModalComponent } = useConfirmModal();

  const handleDeleteGroup = async (id: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Grupo',
      message: '¿Estás seguro de que deseas eliminar este grupo? Los participantes quedarán sin grupo.',
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    setProcessingId(`group-${id}`);
    setConfirmLoading(true);
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
        notify({
          title: 'Grupo eliminado',
          titleColor: 'var(--color-accent)',
          subtitle: 'El grupo se ha eliminado exitosamente',
          subtitleColor: 'var(--color-muted)',
          borderColor: 'var(--color-accent)',
          duration: 3000,
        });
        onRefresh();
      } else {
        const result = await response.json();
        notify({
          title: 'Error',
          titleColor: 'var(--error)',
          subtitle: result.error || 'Error al eliminar grupo',
          subtitleColor: 'var(--color-muted)',
          borderColor: 'var(--error)',
          duration: 4000,
        });
      }
    } catch {
      notify({
        title: 'Error de red',
        titleColor: 'var(--error)',
        subtitle: 'Error al conectar con el servidor',
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--error)',
        duration: 4000,
      });
    } finally {
      setProcessingId(null);
      setConfirmLoading(false);
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
        notify({
          title: 'Cambio realizado',
          titleColor: 'var(--color-accent)',
          subtitle: 'Se ha movido al participante correctamente',
          subtitleColor: 'var(--color-muted)',
          borderColor: 'var(--color-accent)',
          duration: 2500,
        });
        onRefresh();
      } else {
        const result = await response.json();
        notify({
          title: 'Error',
          titleColor: 'var(--error)',
          subtitle: result.error || 'Error al mover participante',
          subtitleColor: 'var(--color-muted)',
          borderColor: 'var(--error)',
          duration: 4000,
        });
      }
    } catch {
      notify({
        title: 'Error de red',
        titleColor: 'var(--error)',
        subtitle: 'Error al conectar con el servidor',
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--error)',
        duration: 4000,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const participantsByGroup = groups.reduce((acc, group) => {
    acc[group.id] = participants.filter(p => p.grupoId === group.id);
    return acc;
  }, {} as Record<number, Participant[]>);

  const unassignedParticipants = participants.filter(p => !p.grupoId);

  return (
    <div className="space-y-6">

      <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
        <h3 className="text-sm font-bold text-orange-800 mb-3 flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Participantes sin grupo ({unassignedParticipants.length})
        </h3>
        {unassignedParticipants.length === 0 ? (
          <p className="text-xs text-orange-600 italic">Todos los participantes tienen grupo.</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
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
                <div className="flex items-center justify-between p-3 bg-[color:var(--color-accent)] border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/20 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                      {group.nombre.match(/\d+/)?.[0] || group.nombre.charAt(0)}
                    </div>
                    <span className="font-bold text-white">{group.nombre}</span>
                    <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full">
                      {participantsByGroup[group.id]?.length || 0} integrantes
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      disabled={processingId === `group-${group.id}`}
                      className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
                      title="Eliminar grupo"
                    >
                      {processingId === `group-${group.id}` ? (
                        <Spinner size="sm" />
                      ) : (
                        <Trash2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>
                </div>

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

      <ConfirmModalComponent />
    </div>
  );
};
