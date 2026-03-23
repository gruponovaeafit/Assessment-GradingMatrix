import React, { useState } from 'react';
import { type Group } from '../schemas/configSchemas';
import { authFetch } from '@/lib/auth/authFetch';
import { showToast } from '@/components/UI/Toast';
import { Spinner } from '@/components/UI/Loading';

interface EditGroupsFormProps {
  groups: Group[];
  onRefresh: () => void;
  logout: () => void;
}

export const EditGroupsForm: React.FC<EditGroupsFormProps> = ({
  groups,
  onRefresh,
  logout,
}) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este grupo? Los participantes y staff asignados quedarán sin grupo.')) {
      return;
    }

    setDeletingId(id);
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
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-2">
        Lista de grupos actuales en este assessment. Eliminar un grupo desvinculará a sus integrantes.
      </p>
      
      {groups.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl text-gray-400">
          No hay grupos creados
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {groups.map((group) => (
            <div 
              key={group.id} 
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-200 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold">
                  {group.nombre.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{group.nombre}</h3>
                  <p className="text-xs text-gray-500">ID: {group.id}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleDelete(group.id)}
                disabled={deletingId === group.id}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                title="Eliminar grupo"
              >
                {deletingId === group.id ? (
                  <Spinner size="sm" />
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
