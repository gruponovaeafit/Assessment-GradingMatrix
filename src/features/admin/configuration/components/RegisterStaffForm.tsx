import React from 'react';
import { type Base } from '../schemas/configSchemas';
import { Box } from '@/components/UI/Box';
import { Button } from '@/components/UI/Button';
import { InputBox } from '@/components/UI/InputBox';

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
      <Box className="p-4 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Registrar Staff</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputBox
              label="Correo"
              type="email"
              placeholder="Correo del staff"
              value={staffCorreo}
              onChange={(e) => setStaffCorreo(e.target.value)}
            />
            <InputBox
              label="Contraseña"
              type="password"
              placeholder="Contraseña"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-base font-semibold text-gray-700">Rol</label>
              <select
                value={staffRol}
                onChange={(e) => {
                  setStaffRol(e.target.value);
                  if (e.target.value === 'registrador') {
                    setStaffBaseId('');
                  }
                }}
                className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
              >
                <option value="">Seleccionar rol</option>
                <option value="calificador">Calificador</option>
                <option value="registrador">Registrador</option>
              </select>
            </div>

            {staffRol === 'calificador' && (
              <div className="flex flex-col gap-1">
                <label className="text-base font-semibold text-gray-700">Base</label>
                <select
                  value={staffBaseId}
                  onChange={(e) => setStaffBaseId(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                >
                  <option value="">Seleccionar Base</option>
                  {basesList.length === 0 ? (
                    <option value="" disabled>No hay bases para este assessment</option>
                  ) : (
                    basesList.map((b) => (
                      <option key={b.ID_Base} value={String(b.ID_Base)}>
                        {`Base ${b.Numero_Base} - ${b.Nombre_Base}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-2">
            <Button
              type="submit"
              loading={creatingStaff}
              className="px-8 py-3"
            >
              Registrar {staffRol === 'calificador' ? 'Calificador' : staffRol === 'registrador' ? 'Registrador' : 'Staff'}
            </Button>
          </div>
        </form>
      </Box>
    </div>
  );
};
