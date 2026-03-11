import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { type MassActionItem } from '../schemas/superAdminSchemas';

interface MassActionModalProps {
  title: string;
  description: string;
  items: MassActionItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const MassActionModal: React.FC<MassActionModalProps> = ({
  title,
  description,
  items,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-scaleIn">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-3">
          {items.map((item) => (
            <div 
              key={item.key} 
              className={`flex items-center justify-between p-3 rounded-xl border transition ${
                item.status === 'crear' 
                  ? 'border-success/20 bg-success/5' 
                  : 'border-gray-200 bg-gray-50 opacity-60'
              }`}
            >
              <div>
                <p className="text-sm font-bold text-gray-900">{item.title}</p>
                {item.subtitle && <p className="text-xs text-gray-500">{item.subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'crear' ? (
                  <>
                    <span className="text-[10px] font-bold uppercase text-success">Pendiente</span>
                    <CheckCircle2 className="w-5 h-5 text-success" />
                  </>
                ) : (
                  <>
                    <span className="text-[10px] font-bold uppercase text-gray-400">Existente (Omitir)</span>
                    <AlertCircle className="w-5 h-5 text-gray-400" />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-white transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 rounded-xl bg-[color:var(--color-accent)] text-white font-bold hover:bg-[#5B21B6] shadow-md shadow-purple-200 transition"
          >
            Confirmar Operación
          </button>
        </div>
      </div>
    </div>
  );
};
