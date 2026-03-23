import React from 'react';
import { Box } from '@/components/UI/Box';
import { Button } from '@/components/UI/Button';
import { InputBox } from '@/components/UI/InputBox';
import { notify } from '@/components/UI/Notification';
import { type Base, type BaseFormData } from '../schemas/basesSchemas';

interface BaseModalProps {
  showModal: boolean;
  editingBase: Base | null;
  formData: BaseFormData;
  setFormData: React.Dispatch<React.SetStateAction<BaseFormData>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const BaseModal: React.FC<BaseModalProps> = ({
  showModal,
  editingBase,
  formData,
  setFormData,
  onClose,
  onSubmit,
}) => {
  if (!showModal) return null;

  const isEditing = !!editingBase;

  const handleCancel = () => {
    notify({
      title: isEditing ? 'Edicion cancelada' : 'Creacion cancelada',
      titleColor: 'var(--error)',
      subtitle: isEditing
        ? 'Se cancelo la edicion de la base'
        : 'Se cancelo la creacion de la base',
      subtitleColor: 'var(--color-muted)',
      borderColor: 'var(--error)',
      duration: 3000,
    });
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const camposObligatorios = [
      formData.nombre,
      formData.descripcion,
      formData.competencia,
      formData.comportamiento1,
      formData.comportamiento2,
      formData.comportamiento3,
      ...(!isEditing ? [formData.numeroBase] : []),
    ];

    if (camposObligatorios.some((campo) => !campo?.trim())) {
      notify({
        title: 'Campos incompletos',
        titleColor: 'var(--error)',
        subtitle: 'Todos los campos son obligatorios',
        subtitleColor: 'var(--color-muted)',
        borderColor: 'var(--error)',
        duration: 3000,
      });
      return;
    }

    onSubmit(e);
    notify({
      title: isEditing ? 'Base editada' : 'Base creada',
      titleColor: 'var(--color-accent)',
      subtitle: isEditing
        ? 'Se confirmo la edicion de la base correctamente'
        : 'Se confirmo la creacion de la base correctamente',
      subtitleColor: 'var(--color-muted)',
      borderColor: 'var(--color-accent)',
      duration: 3000,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <Box className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Base' : 'Crear Nueva Base'}
          </h2>
          <Button variant="error" onClick={handleCancel} className="!px-3 !py-1 text-base font-bold">
            X
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <InputBox
              label="Numero de Base"
              type="number"
              value={formData.numeroBase}
              onChange={(e) => {
                if (e.target.value.length <= 2) {
                  setFormData({ ...formData, numeroBase: e.target.value });
                }
              }}
              placeholder="Ej: 1"
              maxLength={2}
            />
          )}

          <InputBox
            label="Nombre de la Base"
            type="text"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            placeholder="Inserte el nombre de la base"
            maxLength={100}
          />

          <InputBox
            label="Descripcion"
            type="textarea"
            rows={3}
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            placeholder="Inserte pequeña descripcion de la base (Visible para calificadores)"
            maxLength={500}
          />

          <InputBox
            label="Competencia"
            type="text"
            value={formData.competencia}
            onChange={(e) => setFormData({ ...formData, competencia: e.target.value })}
            placeholder="Competencia general a evaluar"
            maxLength={500}
          />

          <InputBox
            label="Comportamiento 1"
            type="textarea"
            rows={2}
            value={formData.comportamiento1}
            onChange={(e) => setFormData({ ...formData, comportamiento1: e.target.value })}
            placeholder="Primer comportamiento a evaluar"
            maxLength={500}
          />

          <InputBox
            label="Comportamiento 2"
            type="textarea"
            rows={2}
            value={formData.comportamiento2}
            onChange={(e) => setFormData({ ...formData, comportamiento2: e.target.value })}
            placeholder="Segundo comportamiento a evaluar"
            maxLength={500}
          />

          <InputBox
            label="Comportamiento 3"
            type="textarea"
            rows={2}
            value={formData.comportamiento3}
            onChange={(e) => setFormData({ ...formData, comportamiento3: e.target.value })}
            placeholder="Tercer comportamiento a evaluar"
            maxLength={500}
          />

          <div className="flex gap-3 pt-4">
            <Button variant="error" type="button" onClick={handleCancel} className="flex-1">
              Cancelar
            </Button>
            <Button variant="accent" type="submit" className="flex-1">
              {isEditing ? 'Editar Base' : 'Crear Base'}
            </Button>
          </div>
        </form>
      </Box>
    </div>
  );
};