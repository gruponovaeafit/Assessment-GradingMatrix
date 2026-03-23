import { useState } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { authFetch } from '@/lib/auth/authFetch';
import { notify } from '@/components/UI/Notification';
import { useConfirmModal } from '@/components/UI/ConfirmModal';
import { type Base, type BaseFormData } from '../schemas/basesSchemas';

interface UseBasesActionsProps {
  bases: Base[];
  setBases: React.Dispatch<React.SetStateAction<Base[]>>;
}

export const useBasesActions = ({ bases, setBases }: UseBasesActionsProps) => {
  const { logout } = useAdminAuth();
  const { confirm, setIsLoading: setConfirmLoading, ConfirmModalComponent } = useConfirmModal();

  const [showModal, setShowModal] = useState(false);
  const [editingBase, setEditingBase] = useState<Base | null>(null);
  
  const initialFormData: BaseFormData = {
    numeroBase: '',
    nombre: '',
    competencia: '',
    descripcion: '',
    comportamiento1: '',
    comportamiento2: '',
    comportamiento3: '',
  };
  const [formData, setFormData] = useState<BaseFormData>(initialFormData);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingBase(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (base: Base) => {
    setEditingBase(base);
    setFormData({
      numeroBase: base.Numero_Base.toString(),
      nombre: base.Nombre_Base,
      competencia: base.Competencia_Base,
      descripcion: base.Descripcion_Base,
      comportamiento1: base.Comportamiento1_Base,
      comportamiento2: base.Comportamiento2_Base,
      comportamiento3: base.Comportamiento3_Base,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingBase) {
        // Update
        const response = await authFetch(
          '/api/base/update',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idBase: editingBase.ID_Base,
              nombre: formData.nombre,
              competencia: formData.competencia,
              descripcion: formData.descripcion,
              comportamiento1: formData.comportamiento1,
              comportamiento2: formData.comportamiento2,
              comportamiento3: formData.comportamiento3,
            }),
          },
          () => logout()
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar base');
        }

        notify({
          title: 'Base actualizada',
          titleColor: 'var(--color-accent)',
          subtitle: 'La base se ha actualizado exitosamente',
          subtitleColor: 'var(--color-muted)',
          borderColor: 'var(--color-accent)',
          duration: 3000,
        });
        
        // Update local list
        setBases((prevBases) => 
          prevBases.map((b) => 
            b.ID_Base === editingBase.ID_Base 
              ? { ...b, ...formData, Nombre_Base: formData.nombre } as Base
              : b
          )
        );
      } else {
        // Create
        const response = await authFetch(
          '/api/base/create',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              numeroBase: Number(formData.numeroBase),
              nombre: formData.nombre,
              competencia: formData.competencia,
              descripcion: formData.descripcion,
              comportamiento1: formData.comportamiento1,
              comportamiento2: formData.comportamiento2,
              comportamiento3: formData.comportamiento3,
            }),
          },
          () => logout()
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear base');
        }

        const result = await response.json();
        notify({
          title: 'Base creada',
          titleColor: 'var(--color-accent)',
          subtitle: 'La base se ha creado exitosamente',
          idLabel: 'ID Asignado:',
          idValue: result.ID_Base,
          idColor: 'var(--color-accent)',
          borderColor: 'var(--color-accent)',
          duration: 3000,
        });
        
        // Refresh bases
        const refreshResponse = await authFetch(
          `/api/base/list`,
          {},
          () => logout()
        );
        if (refreshResponse.ok) {
          const refreshedBases = await refreshResponse.json();
          setBases(refreshedBases || []);
        }
      }

      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error en la operación';
      notify({
        title: 'Error',
        titleColor: 'var(--error)',
        subtitle: message,
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--error)',
        duration: 4000,
      });
    }
  };

  const handleDelete = async (baseId: number) => {
    const isConfirmed = await confirm({
      title: 'Eliminar Base',
      message: '¿Estás seguro de eliminar esta base? Esta acción no se puede deshacer y eliminará las calificaciones asociadas.',
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    setConfirmLoading(true);
    try {
      const response = await authFetch(
        '/api/base/delete',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idBase: baseId }),
        },
        () => logout()
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar base');
      }

      notify({
        title: 'Base eliminada',
        titleColor: 'var(--color-accent)',
        subtitle: 'La base se ha eliminado exitosamente',
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--color-accent)',
        duration: 3000,
      });
      setBases((prevBases) => prevBases.filter((b) => b.ID_Base !== baseId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar base';
      notify({
        title: 'Error al eliminar',
        titleColor: 'var(--error)',
        subtitle: message,
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--error)',
        duration: 4000,
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  return {
    showModal,
    setShowModal,
    editingBase,
    formData,
    setFormData,
    resetForm,
    handleOpenCreate,
    handleOpenEdit,
    handleSubmit,
    handleDelete,
    ConfirmModalComponent
  };
};
