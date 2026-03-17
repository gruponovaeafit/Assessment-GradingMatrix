import React from 'react';
import { Save, CheckCircle2, XCircle, LogIn } from 'lucide-react';
import { type Assessment, type GrupoEstudiantil } from '../schemas/superAdminSchemas';
import { useRouter } from 'next/navigation';

/**
 * AssessmentList - View and Edit Assessments
 * 
 * This component renders a list of assessments with inline editing capabilities.
 */
interface AssessmentListProps {
  assessments: Assessment[];
  gruposEstudiantiles: GrupoEstudiantil[];
  assessmentEdits: Record<number, { descripcion: string; activo: boolean; grupoId: string }>;
  setAssessmentEdits: React.Dispatch<React.SetStateAction<Record<number, { descripcion: string; activo: boolean; grupoId: string }>>>;
  onUpdate: (id: number) => void;
  loading: boolean;
}

export const AssessmentList: React.FC<AssessmentListProps> = ({
  assessments,
  gruposEstudiantiles,
  assessmentEdits,
  setAssessmentEdits,
  onUpdate,
  loading,
}) => {
  const router = useRouter();
  const [switchingAssessment, setSwitchingAssessment] = React.useState<number | null>(null);

  const handleSwitchAssessment = async (assessmentId: number) => {
    setSwitchingAssessment(assessmentId);
    try {
      const response = await fetch('/api/auth/switch-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId }),
      });

      if (response.ok) {
        router.push('/admin');
      } else {
        const data = await response.json();
        alert(data.error || 'Error al cambiar de assessment');
      }
    } catch {
      alert('Error al cambiar de assessment');
    } finally {
      setSwitchingAssessment(null);
    }
  };

  if (assessments.length === 0) {
    return (
      <div className="p-10 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
        No se encontraron assessments con los filtros actuales.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {assessments.map((assessment) => {
        const edit = assessmentEdits[assessment.id];
        if (!edit) return null;

        return (
          <div key={assessment.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 leading-tight">{assessment.nombre}</h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">ID: {assessment.id}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={edit.activo}
                  disabled={loading}
                  onChange={(e) =>
                    setAssessmentEdits((prev) => ({
                      ...prev,
                      [assessment.id]: { ...edit, activo: e.target.checked },
                    }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[color:var(--color-accent)]"></div>
                <span className="ml-2 text-xs font-bold text-gray-500 uppercase tracking-tighter">
                  {edit.activo ? 'Activo' : 'Inactivo'}
                </span>
              </label>
            </div>

            <div className="space-y-3 flex-1">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Grupo Estudiantil</label>
                <select
                  value={edit.grupoId}
                  disabled={loading}
                  onChange={(e) =>
                    setAssessmentEdits((prev) => ({
                      ...prev,
                      [assessment.id]: { ...edit, grupoId: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm text-gray-900"
                >
                  <option value="">Sin Grupo</option>
                  {gruposEstudiantiles.map((grupo) => (
                    <option key={grupo.id} value={String(grupo.id)}>
                      {grupo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descripción</label>
                <textarea
                  value={edit.descripcion}
                  disabled={loading}
                  onChange={(e) =>
                    setAssessmentEdits((prev) => ({
                      ...prev,
                      [assessment.id]: { ...edit, descripcion: e.target.value },
                    }))
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-[color:var(--color-accent)] outline-none transition text-sm text-gray-900 resize-none"
                  placeholder="Sin descripción..."
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between">
              <button
                type="button"
                onClick={() => handleSwitchAssessment(assessment.id)}
                disabled={switchingAssessment === assessment.id}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                {switchingAssessment === assessment.id ? 'Entrando...' : 'Entrar como admin'}
              </button>
              <button
                type="button"
                onClick={() => onUpdate(assessment.id)}
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
