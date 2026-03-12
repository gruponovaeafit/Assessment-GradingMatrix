import React from 'react';
import { type UseRegisterFormReturn } from '../hooks/useRegisterForm';

type RegisterFormProps = Pick<
  UseRegisterFormReturn,
  | 'nombre' | 'setNombre'
  | 'correo' | 'setCorreo'
  | 'photo' | 'fileName'
  | 'mensaje' | 'isError' | 'enviando'
  | 'fileInputRef'
  | 'handleImageSelect' | 'handleSubmit'
>;

export const RegisterForm: React.FC<RegisterFormProps> = ({
  nombre,
  setNombre,
  correo,
  setCorreo,
  photo,
  fileName,
  mensaje,
  isError,
  enviando,
  fileInputRef,
  handleImageSelect,
  handleSubmit,
}) => {
  return (
    <div className="w-full max-w-md mx-auto flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center gap-4 p-8 w-full max-w-[380px] bg-white shadow-lg rounded-2xl border border-gray-100"
      >
        <h1 className="text-3xl font-extrabold mb-4 text-gray-900 text-center">
          Inscribir Aspirante
        </h1>

        <div className="w-full">
          <label className="block text-lg font-semibold mb-1 text-gray-800">
            Nombre
          </label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 bg-white"
          />
        </div>

        <div className="w-full">
          <label className="block text-lg font-semibold mb-1 text-gray-800">
            Correo Electrónico
          </label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 bg-white"
          />
        </div>

        <div className="w-full">
          <label className="block text-lg font-semibold mb-1 text-gray-800">
            Foto del Aspirante
          </label>

          {/* Abre la cámara en móvil (capture="environment"); en escritorio puede ofrecer cámara o archivos según el navegador */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageSelect(file);
                }
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-md bg-purple-600 text-white font-medium hover:bg-purple-700"
            >
              Tomar foto
            </button>
            <span className="text-sm font-medium text-gray-800 min-w-0">
              {fileName || 'Sin foto seleccionada'}
            </span>
          </div>
        </div>

        {/* Zona de vista previa: siempre visible */}
        <div className="flex flex-col items-center gap-1 mt-2">
          <div className="w-28 h-28 rounded-full border-4 border-purple-600 flex items-center justify-center overflow-hidden bg-gray-100 shrink-0">
            {photo ? (
              <img
                src={photo}
                alt="Foto del aspirante"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-500 text-xs text-center px-2">Sin foto</span>
            )}
          </div>
          <span className="text-sm text-gray-600 font-medium">Vista previa</span>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-lg bg-purple-700 text-white py-3 font-semibold"
        >
          {enviando ? 'Inscribiendo...' : 'Inscribir'}
        </button>

        {mensaje && (
          <p
            className={`text-center font-medium ${
              isError ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {mensaje}
          </p>
        )}
      </form>
    </div>
  );
};
