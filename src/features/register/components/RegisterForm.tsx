"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Box } from '@/components/UI/Box';
import { InputBox } from '@/components/UI/InputBox';
import { Button } from '@/components/UI/Button';
import { NotificationProvider } from '@/components/UI/Notification';
import { CameraCapture } from './CameraCapture';
import { type UseRegisterFormReturn } from '../hooks/useRegisterForm';

type RegisterFormProps = Pick<
  UseRegisterFormReturn,
  | 'nombre' | 'setNombre'
  | 'correo' | 'setCorreo'
  | 'photo' | 'fileName'
  | 'enviando'
  | 'fileInputRef'
  | 'handleImageSelect'
> & {
  handleSubmit: (e: React.FormEvent) => void;
  onLogout: () => void;
};

export const RegisterForm: React.FC<RegisterFormProps> = ({
  nombre,
  setNombre,
  correo,
  setCorreo,
  photo,
  enviando,
  fileInputRef,
  handleImageSelect,
  handleSubmit,
  onLogout,
}) => {
  const [showCamera, setShowCamera] = useState(false);

  const handleCameraCapture = (file: File) => {
    setShowCamera(false);
    handleImageSelect(file);
  };

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white px-4 py-4 lg:py-2 relative overflow-hidden">

        {/* Cerrar sesión - Posicionado absoluto para ahorrar espacio vertical */}
        <div className="absolute top-4 right-4 z-10">
          <Button variant="error" onClick={onLogout} className="flex items-center gap-2 px-3 py-2 sm:px-4">
            <span className="hidden sm:inline">Cerrar Sesión</span>
            <Image src="/LogoutIcon.svg" alt="logout" width={18} height={18} />
          </Button>
        </div>

        <div className="w-full max-w-[380px] mt-8 lg:mt-0">

          {/* Título */}
          <h1 className="text-center mb-2 text-2xl sm:text-3xl font-extrabold text-purple-400 leading-tight drop-shadow-[3px_4px_1.5px_rgba(0,0,0,0.15)]">
            Inscribir Participante
          </h1>

          {/* Subtítulo */}
          <p className="text-gray-400 text-xs sm:text-sm font-semibold text-center mb-4 sm:mb-6">
            Añade la información de cada participante para continuar.
          </p>

          <form onSubmit={handleSubmit}>
            <Box className="flex flex-col gap-3 sm:gap-4 xl:gap-5 p-4 sm:p-6">

              <InputBox
                label="Nombre"
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={enviando}
              />

              <InputBox
                label="Correo Electrónico"
                type="email"
                placeholder="Correo electrónico"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                disabled={enviando}
              />

              {/* Foto */}
              <div className="w-full flex flex-col gap-1">
                <label className="text-sm sm:text-base font-semibold text-gray-700">
                  Foto del aspirante
                </label>

                {/* Input oculto para galería */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageSelect(file);
                    e.target.value = '';
                  }}
                />

                {/* Preview con botón superpuesto */}
                <div className="relative flex justify-center mt-1 mb-2 sm:mb-4">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[color:var(--color-accent)] flex items-center justify-center overflow-hidden bg-gray-100 shrink-0">
                    {photo ? (
                      <img
                        src={photo}
                        alt="Foto del aspirante"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs sm:text-sm text-center px-4">Sin foto</span>
                    )}
                  </div>

                  {/* Botón cámara superpuesto */}
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    disabled={enviando}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[color:var(--color-accent)] flex items-center justify-center shadow-md hover:bg-[#5B21B6] transition disabled:opacity-50"
                  >
                    <Image src="/CameraIcon.svg" alt="Tomar foto" width={24} height={24} className="sm:w-[30px] sm:h-[30px]" />
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="accent"
                loading={enviando}
                className="w-full mt-2 py-2 sm:py-3 text-base sm:text-lg"
              >
                {!enviando && 'Confirmar Inscripción'}
              </Button>

            </Box>
          </form>

        </div>

        {/* Footer */}
        <footer className="mt-4 lg:mt-6 xl:mt-8 text-gray-400 text-sm sm:text-base xl:text-lg italic">
          POWERED BY{" "}
          <span className="font-bold text-xl sm:text-2xl text-purple-400">Nova</span>
        </footer>

        <NotificationProvider />

      </div>
    </>
  );
};