import React from 'react';
import { type Base } from '../schemas/configSchemas';
import { Box } from '@/components/UI/Box';
import { Button } from '@/components/UI/Button';
import { InputBox } from '@/components/UI/InputBox';
import { EmailInput } from '@/components/UI/EmailInput';

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
  const isRegistrador = staffRol === 'registrador';
  const isCalificador = staffRol === 'calificador';
  const showBaseField = true;

  return (
    <div className="w-full max-w-[900px] mb-4 px-1 sm:px-2">
      <Box className="p-4 sm:p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Registrar Staff</h2>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EmailInput
              label="Correo"
              placeholder="Correo del staff"
              value={staffCorreo}
              onChange={setStaffCorreo}
              disabled={creatingStaff}
            />
            <InputBox
              label="Contrasena"
              type="password"
              placeholder="Contrasena"
              value={staffPassword}
              onChange={(e) => setStaffPassword(e.target.value)}
              disabled={creatingStaff}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-base font-semibold text-gray-700">Rol</label>
              <select
                value={staffRol}
                disabled={creatingStaff}
                onChange={(e) => {
                  setStaffRol(e.target.value);
                  if (e.target.value === 'registrador') setStaffBaseId('');
                }}
                className={`w-full px-4 py-3 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-400 transition
                  ${creatingStaff ? 'bg-gray-100 cursor-not-allowed opacity-75' : ''}`}
              >
                <option value="">Seleccionar rol</option>
                <option value="calificador">Calificador</option>
                <option value="registrador">Registrador</option>
              </select>
            </div>

            {showBaseField && (
              <div className="flex flex-col gap-1">
                <label className={`text-base font-semibold ${!isCalificador || creatingStaff ? 'text-gray-400' : 'text-gray-700'}`}>
                  Base
                </label>
                <select
                  value={staffBaseId}
                  onChange={(e) => isCalificador && setStaffBaseId(e.target.value)}
                  disabled={!isCalificador || creatingStaff}
                  className={`w-full px-4 py-3 rounded-lg border transition focus:outline-none
                    ${(!isCalificador || creatingStaff)
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-purple-400'
                    }`}
                >
                  <option value="">
                    {!isCalificador ? 'Solo editable para calificadores' : 'Seleccionar Base'}
                  </option>
                  {isCalificador && (
                    basesList.length === 0 ? (
                      <option value="" disabled>No hay bases para este assessment</option>
                    ) : (
                      basesList.map((b) => (
                        <option key={b.ID_Base} value={String(b.ID_Base)}>
                          {`Base ${b.Numero_Base} - ${b.Nombre_Base}`}
                        </option>
                      ))
                    )
                  )}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="accent"
              loading={creatingStaff}
              className="w-full sm:w-auto px-12"
            >
              Registrar Staff
            </Button>
          </div>
        </form>
      </Box>
    </div>
  );
};