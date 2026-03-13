import React from 'react';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { RegisterForm } from './RegisterForm';
import { SuccessModal } from './SuccessModal';

export const RegisterContainer: React.FC = () => {
  const {
    nombre,
    setNombre,
    correo,
    setCorreo,
    photo,
    fileName,
    mensaje,
    isError,
    enviando,
    successModalId,
    fileInputRef,
    handleImageSelect,
    handleSubmit,
    resetForm,
  } = useRegisterForm();

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white px-4 py-8">
      <RegisterForm
        nombre={nombre}
        setNombre={setNombre}
        correo={correo}
        setCorreo={setCorreo}
        photo={photo}
        fileName={fileName}
        mensaje={mensaje}
        isError={isError}
        enviando={enviando}
        fileInputRef={fileInputRef}
        handleImageSelect={handleImageSelect}
        handleSubmit={handleSubmit}
      />
      <SuccessModal
        successId={successModalId}
        onDismiss={resetForm}
      />
    </div>
  );
};
