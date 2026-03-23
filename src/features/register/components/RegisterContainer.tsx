"use client";

import React, { useState, useEffect } from 'react';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { useRegisterAuth } from '../hooks/useRegisterAuth';
import { RegisterForm } from './RegisterForm';
import { ConfirmRegisterModal } from './ConfirmRegisterModal';
import { notify } from '@/components/UI/Notification';

export const RegisterContainer: React.FC = () => {
  const { logout } = useRegisterAuth();
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    nombre,
    setNombre,
    correo,
    setCorreo,
    photo,
    fileName,
    enviando,
    successModalId,
    fileInputRef,
    handleImageSelect,
    handleSubmit,
    resetForm,
  } = useRegisterForm();

  const handleRequestConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !correo) {
      notify({
        title: "Error al registrar participante",
        titleColor: "var(--error)",
        subtitle: "Recuerda llenar los campos de texto",
        subtitleColor: "var(--color-muted)",
        borderColor: "var(--error)",
        duration: 4000,
      });
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    handleSubmit(
      { preventDefault: () => {} } as React.FormEvent,
      (msg) => notify({
        title: "Error al registrar participante",
        titleColor: "var(--error)",
        subtitle: msg,
        subtitleColor: "var(--color-muted)",
        borderColor: "var(--error)",
        duration: 4000,
      })
    );
  };

  const handleCancel = () => {
    setShowConfirm(false);
    notify({
      title: "Inscripción cancelada",
      titleColor: "var(--error)",
      subtitle: "Puedes seguir editando la información del participante",
      subtitleColor: "var(--color-muted)",
      borderColor: "var(--error)",
      duration: 4000,
    });
  };

  const handleSuccess = (id: number) => {
    notify({
      title: "¡Participante inscrito!",
      titleColor: "var(--success)",
      subtitle: "El participante fue asignado con éxito",
      subtitleColor: "var(--color-muted)",
      borderColor: "var(--success)",
      idLabel: "El participante fue asignado con ID:",
      idValue: id,
      idColor: "var(--success)",
      duration: 5000,
    });
    resetForm();
  };

  useEffect(() => {
    if (successModalId !== null && successModalId !== undefined) {
      handleSuccess(successModalId);
    }
  }, [successModalId]);

  return (
    <>
      <RegisterForm
        nombre={nombre}
        setNombre={setNombre}
        correo={correo}
        setCorreo={setCorreo}
        photo={photo}
        fileName={fileName}
        enviando={enviando}
        fileInputRef={fileInputRef}
        handleImageSelect={handleImageSelect}
        handleSubmit={handleRequestConfirm}
        onLogout={logout}
      />

      {showConfirm && (
        <ConfirmRegisterModal
          nombre={nombre}
          correo={correo}
          photo={photo}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </>
  );
};