import React from 'react';
import { EmailInput } from '@/components/UI/EmailInput';
import { Save, ShieldCheck, Mail, Lock, Building } from 'lucide-react';
import { type AdminUser } from '../schemas/superAdminSchemas';

/**
 * AdminUserList - View and Edit Administrators
 */
interface AdminUserListProps {
  admins: AdminUser[];
  adminEdits: Record<number, { correo: string; password: string }>;
  setAdminEdits: React.Dispatch<React.SetStateAction<Record<number, { correo: string; password: string }>>>;
  onUpdate: (id: number) => void;
  loading: boolean;
}

export const AdminUserList: React.FC<AdminUserListProps> = ({
  admins,
  adminEdits,
  setAdminEdits,
  onUpdate,
  loading,
}) => {
  if (admins.length === 0) {
    return (
      <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
        No se encontraron administradores con los filtros actuales.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {admins.map((admin) => {
        const edit = adminEdits[admin.id];
        if (!edit) return null;

        return (
          <div key={admin.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-[color:var(--color-accent)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{admin.correo}</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  <Building className="w-3 h-3" />
                  <span className="truncate">{admin.grupoNombre || 'Sin Grupo'}</span>
                  <span>•</span>
                  <span className="truncate">{admin.assessmentNombre || 'Sin Assessment'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <EmailInput
                  label="Email de Acceso"
                  value={edit.correo}
                  disabled={loading}
                  onChange={(val) =>
                    setAdminEdits((prev) => ({
                      ...prev,
                      [admin.id]: { ...edit, correo: val },
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Nueva Contraseña (opcional)
                </label>
                <input
                  type="password"
                  value={edit.password}
                  disabled={loading}
                  onChange={(e) =>
                    setAdminEdits((prev) => ({
                      ...prev,
                      [admin.id]: { ...edit, password: e.target.value },
                    }))
                  }
                  placeholder="Dejar en blanco para no cambiar"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm text-gray-900"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => onUpdate(admin.id)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-xs font-bold shadow-md shadow-purple-200 transition disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar cambios
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
