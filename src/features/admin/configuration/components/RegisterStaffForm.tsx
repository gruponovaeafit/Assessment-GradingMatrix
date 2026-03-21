import React from 'react';
import { type Base } from '../schemas/configSchemas';

interface RegisterStaffFormProps {
  staffCorreo: string;
  setStaffCorreo: (val: string) => void;
  staffPassword: string;
  setStaffPassword: (val: string) => void;
  staffRol: string;
  setStaffRol: (val: string) => void;
  staffBaseId: string;
  setStaffBaseId: (val: string) => void;
  basesList: Base[];
  creatingStaff: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const RegisterStaffForm: React.FC<RegisterStaffFormProps> = ({
  staffCorreo,
  setStaffCorreo,
  staffPassword,
  setStaffPassword,
  staffRol,
  setStaffRol,
  staffBaseId,
  setStaffBaseId,
  basesList,
  creatingStaff,
  onSubmit,
}) => {
  return (
    <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
      <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Registrar Staff</h2>
        <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="email"
            placeholder="Correo del staff"
            value={staffCorreo}
            onChange={(e) => setStaffCorreo(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={staffPassword}
            onChange={(e) => setStaffPassword(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
          />

          <select
            value={staffRol}
            onChange={(e) => {
              setStaffRol(e.target.value);
              if (e.target.value === 'registrador') {
                setStaffBaseId('');
              }
            }}
            className={`px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm ${
              staffRol === '' ? 'text-gray-400' : 'text-gray-900'
            }`}
          >
            <option value="" style={{ color: '#9CA3AF' }}>Seleccionar rol</option>
            <option value="calificador" style={{ color: '#111827' }}>Calificador</option>
            <option value="registrador" style={{ color: '#111827' }}>Registrador</option>
          </select>

          {staffRol === 'calificador' && (
            <select
              value={staffBaseId}
              onChange={(e) => setStaffBaseId(e.target.value)}
              className={`px-3 py-2 rounded-lg bg-white border border-gray-300 text-sm ${
                staffBaseId === '' ? 'text-gray-400' : 'text-gray-900'
              }`}
            >
              <option value="" style={{ color: '#9CA3AF' }}>Seleccionar Base</option>
              {basesList.length === 0 ? (
                <option value="" disabled style={{ color: '#9CA3AF' }}>No hay bases para este assessment</option>
              ) : (
                basesList.map((b) => (
                  <option key={b.ID_Base} value={String(b.ID_Base)} style={{ color: '#111827' }}>
                    {`Base ${b.Numero_Base} - ${b.Nombre_Base}`}
                  </option>
                ))
              )}
            </select>
          )}
          
          <div className={`${staffRol === 'calificador' ? 'sm:col-span-2' : 'sm:col-span-1'} flex justify-end`}>
            <button
              type="submit"
              disabled={creatingStaff}
              className="px-4 py-2 rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-sm font-medium transition disabled:opacity-60"
            >
              {creatingStaff ? 'Registrando...' : `Registrar ${staffRol === 'calificador' ? 'Calificador' : 'Registrador'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
