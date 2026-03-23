import React from 'react';
import Image from 'next/image';
import { Box } from '@/components/UI/Box';
import { InputBox } from '@/components/UI/InputBox';
import { Button } from '@/components/UI/Button';
import { NotificationProvider } from '@/components/UI/Notification';
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
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white px-4 py-8 lg:py-6">

      {/* Cerrar sesión */}
      <div className="w-full max-w-[700px] flex justify-end mb-4">
        <Button variant="error" onClick={onLogout} className="flex items-center gap-2">
          Cerrar Sesión
          <Image src="/LogoutIcon.svg" alt="logout" width={18} height={18} />
        </Button>
      </div>

      <div className="w-full max-w-[380px]">

        {/* Título */}
        <h1 className="text-center mb-3 text-2xl sm:text-3xl font-extrabold text-purple-400 leading-tight drop-shadow-[3px_4px_1.5px_rgba(0,0,0,0.15)]">
          Inscribir Participante
        </h1>

        {/* Subtítulo */}
        <p className="text-gray-400 text-sm font-semibold text-center mb-6">
          Añade la información de cada participante, y presiona el botón de confirmar inscripción para pasar al siguiente.
        </p>

        <form onSubmit={handleSubmit}>
          <Box className="flex flex-col gap-4 xl:gap-5">

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
              <label className="text-base font-semibold text-gray-700">
                Foto del aspirante
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageSelect(file);
                  e.target.value = '';
                }}
              />

              {/* Preview con botón superpuesto */}
              <div className="relative flex justify-center mt-1 mb-4">
                <div className="w-40 h-40 rounded-full border-4 border-[color:var(--color-accent)] flex items-center justify-center overflow-hidden bg-gray-100 shrink-0">
                  {photo ? (
                    <img
                      src={photo}
                      alt="Foto del aspirante"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm text-center px-4">Sin foto</span>
                  )}
                </div>

                {/* Botón cámara superpuesto */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={enviando}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 w-12 h-12 rounded-full bg-[color:var(--color-accent)] flex items-center justify-center shadow-md hover:bg-[#5B21B6] transition disabled:opacity-50"
                >
                  <Image src="/CameraIcon.svg" alt="Tomar foto" width={30} height={30} />
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="accent"
              loading={enviando}
              className="w-full mt-2 py-3 text-lg"
            >
              {!enviando && 'Confirmar Inscripción'}
            </Button>

          </Box>
        </form>

      </div>

      {/* Footer */}
      <footer className="mt-6 lg:mt-8 xl:mt-16 text-gray-400 text-base xl:text-lg italic">
        POWERED BY{" "}
        <span className="font-bold text-2xl text-purple-400">Nova</span>
      </footer>

      <NotificationProvider />

    </div>
  );
};