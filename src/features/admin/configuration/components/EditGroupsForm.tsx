import React, { useState } from 'react';
import { type Group, type Participant } from '../schemas/configSchemas';
import { authFetch } from '@/lib/auth/authFetch';
import { notify } from '@/components/UI/Notification';
import { useConfirmModal } from '@/components/UI/ConfirmModal';
import { Spinner } from '@/components/UI/Loading';
import { Trash2, UserPlus, Ghost, XCircle, PlusCircle } from 'lucide-react';

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
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const { confirm, setIsLoading: setConfirmLoading, ConfirmModalComponent } = useConfirmModal();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || isCreatingNewGroup) return;

    setIsCreatingNewGroup(true);
    setProcessingId('creating-new-group');
    try {
      const response = await authFetch(
        '/api/assessment/create-group',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: newGroupName.trim() }),
        },
        () => logout()
      );

      if (response.ok) {
        notify({
          title: 'Grupo creado',
          titleColor: 'var(--color-accent)',
          subtitle: `El grupo "${newGroupName.trim()}" se creó correctamente`,
          subtitleColor: 'var(--color-muted)',
          borderColor: 'var(--color-accent)',
          duration: 3000,
        });
        setNewGroupName('');
        onRefresh();
      } else {
        const result = await response.json();
        notify({
          title: 'Error al crear grupo',
          titleColor: 'var(--error)',
          subtitle: result.error || 'Error al crear el grupo',
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
      setIsCreatingNewGroup(false);
      setProcessingId(null);
    }
  };

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
    if (processingId) return;
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
          title: newGroupId === null ? 'Participante desvinculado' : 'Cambio realizado',
          titleColor: 'var(--color-accent)',
          subtitle: newGroupId === null ? 'Se ha quitado al participante del grupo' : 'Se ha movido al participante correctamente',
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
          subtitle: result.error || 'Error al procesar el cambio',
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

      <div className={`bg-orange-50 border border-orange-100 rounded-xl p-4 transition-opacity ${processingId ? 'opacity-50 pointer-events-none' : ''}`}>
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
                  disabled={!!processingId}
                  className="bg-orange-100 text-orange-800 border-none rounded px-2 py-1 font-bold outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-50"
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

      <div className={`bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 transition-opacity ${processingId ? 'opacity-50 pointer-events-none' : ''}`}>
        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Añadir Grupo Manualmente
        </h3>
        <form onSubmit={handleCreateGroup} className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre del grupo (ej. Grupo 10)"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            disabled={!!processingId}
            className="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 outline-none transition disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!!processingId || !newGroupName.trim()}
            className="bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 disabled:opacity-50"
          >
            {isCreatingNewGroup ? <Spinner size="sm" /> : <PlusCircle className="w-4 h-4" />}
            Crear
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-700">Grupos Existentes</h3>
        {groups.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400 text-sm">
            No hay grupos creados. Usa el sorteo automático o crea uno manual.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className={`bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm transition-opacity ${processingId && !String(processingId).includes(String(group.id)) ? 'opacity-50 pointer-events-none' : ''}`}
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
                      disabled={!!processingId}
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
                      <div key={p.id} className={`flex items-center justify-between group/item ${processingId === `part-${p.id}` ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-2 truncate mr-2">
                          <span className="text-xs font-semibold text-gray-900 truncate max-w-[180px]">{p.nombre}</span>
                          {p.isImpostor && (
                            <span title="Impostor">
                              <Ghost className="w-3 h-3 text-purple-400 flex-shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <select
                            onChange={(e) => handleMoveParticipant(p.id, Number(e.target.value))}
                            disabled={!!processingId}
                            className="text-[10px] bg-transparent hover:bg-purple-100 text-gray-600 border border-gray-200 rounded px-1.5 py-0.5 outline-none transition disabled:opacity-50 cursor-pointer"
                            value=""
                          >
                            <option value="" disabled>Mover a...</option>
                            {groups.filter(g => g.id !== group.id).map(g => (
                              <option key={g.id} value={g.id}>{g.nombre}</option>
                            ))}
                          </select>
                          
                          <button
                            onClick={() => handleMoveParticipant(p.id, null)}
                            disabled={!!processingId}
                            title="Quitar del grupo"
                            className="p-1 rounded-full bg-transparent hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                          >
                            {processingId === `part-${p.id}` ? (
                              <Spinner size="sm" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
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
