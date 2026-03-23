"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { Box } from '@/components/UI/Box';
import { Button } from '@/components/UI/Button';

interface ConfirmRegisterModalProps {
  nombre: string;
  correo: string;
  photo: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmRegisterModal: React.FC<ConfirmRegisterModalProps> = ({
  nombre,
  correo,
  photo,
  onConfirm,
  onCancel,
}) => {
  const [isImpostor, setIsImpostor] = useState(false);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
        <Box className="flex flex-col gap-4 sm:gap-5 lg:gap-6 relative">

          {/* X arriba a la derecha */}
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-md bg-red-500 text-white text-xs font-bold hover:bg-red-400 transition"
          >
            ✕
          </button>

          {/* Título */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 text-center">
            Confirmar Información
          </h2>

          {/* Info */}
          <div className="text-center space-y-1 sm:space-y-2">
          <p className="text-gray-800 text-lg sm:text-xl lg:text-2xl">
            <span className="font-bold">Nombre:</span> {nombre}
          </p>
          <p className="text-gray-800 text-lg sm:text-xl lg:text-2xl">
            <span className="font-bold">Correo:</span> {correo}
          </p>
          </div>

          {/* Foto + ícono infiltrado */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-52 lg:h-52 rounded-full border-4 border-[color:var(--color-accent)] overflow-hidden bg-gray-100 flex items-center justify-center">
                {photo ? (
                  <img src={photo} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-base sm:text-lg lg:text-xl text-center px-2">Sin foto</span>
                )}
              </div>

              {/* Botón infiltrado superpuesto con tooltip */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 group">
                <button
                  type="button"
                  onClick={() => setIsImpostor((prev) => !prev)}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-trasparent border-2 border-[color:var(--color-accent)] flex items-center justify-center shadow-md hover:scale-110 transition"
                >
                  <Image
                    src={isImpostor ? '/ImpostorIcon.svg' : '/NotImpostorIcon.svg'}
                    alt={isImpostor ? 'Infiltrado' : 'Participante'}
                    width={20}
                    height={20}
                    className="sm:w-6 sm:h-6"
                  />
                </button>

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none">
                  {isImpostor ? 'Click para definir como participante' : 'Click para definir infiltrado'}
                </div>
              </div>
            </div>

            {/* Label rol */}
            <p className="text-xs sm:text-sm lg:text-base font-semibold mt-4 sm:mt-5" style={{ color: isImpostor ? 'var(--error)' : 'var(--color-accent)' }}>
              {isImpostor ? 'Infiltrado' : 'Participante'}
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 mt-2">
            <Button
              variant="error"
              className="flex-1 py-2 sm:py-3 text-sm sm:text-base lg:text-lg"
              onClick={onCancel}
            >
              Cancelar
            </Button>
            <Button
              variant="accent"
              className="flex-1 py-2 sm:py-3 text-sm sm:text-base lg:text-lg"
              onClick={onConfirm}
            >
              Confirmar
            </Button>
          </div>

        </Box>
      </div>
    </div>
  );
};