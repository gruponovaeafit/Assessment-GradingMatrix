'use client';

import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../Hooks/useAdminAuth';
import { useRouter } from 'next/navigation';
import { Spinner } from '../../components/UI/Loading';
import { showToast } from '../../components/UI/Toast';
import { authFetch } from '@/lib/authFetch';

interface Base {
  ID_Base: number;
  ID_Assessment: number;
  Numero_Base: number;
  Nombre_Base: string;
  Competencia_Base: string;
  Descripcion_Base: string;
  Comportamiento1_Base: string;
  Comportamiento2_Base: string;
  Comportamiento3_Base: string;
}

interface Assessment {
  id: number;
  nombre: string;
  activo: boolean;
}

export default function BasesPage() {
  const { isAdmin, isLoading: authLoading, requireAdmin, logout, getAuthHeaders } = useAdminAuth();
  const router = useRouter();

  const [bases, setBases] = useState<Base[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<string>('');

  // Estados para crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingBase, setEditingBase] = useState<Base | null>(null);
  const [formData, setFormData] = useState({
    numeroBase: '',
    nombre: '',
    competencia: '',
    descripcion: '',
    comportamiento1: '',
    comportamiento2: '',
    comportamiento3: '',
  });

  // Proteger la ruta
  useEffect(() => {
    requireAdmin();
  }, [isAdmin, authLoading]);

  // Cargar assessments
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    const fetchAssessments = async () => {
      try {
        const response = await authFetch(
          '/api/assessment/list',
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );

        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }

        if (!response.ok) throw new Error('Error al cargar assessments');
        const result = await response.json();
        setAssessments(result || []);
      } catch (err) {
        console.error(err);
        showToast.error('Error al cargar assessments');
      }
    };

    fetchAssessments();
  }, [authLoading, isAdmin, router]);

  // Cargar bases cuando se selecciona assessment
  useEffect(() => {
    if (!selectedAssessment) {
      setBases([]);
      setLoading(false);
      return;
    }

    const fetchBases = async () => {
      setLoading(true);
      try {
        const response = await authFetch(
          `/api/base/list?assessmentId=${selectedAssessment}`,
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );

        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }

        if (!response.ok) throw new Error('Error al cargar bases');
        const result = await response.json();
        setBases(result || []);
      } catch (err) {
        console.error(err);
        showToast.error('Error al cargar bases');
      } finally {
        setLoading(false);
      }
    };

    fetchBases();
  }, [selectedAssessment, authLoading, isAdmin, router]);

  const resetForm = () => {
    setFormData({
      numeroBase: '',
      nombre: '',
      competencia: '',
      descripcion: '',
      comportamiento1: '',
      comportamiento2: '',
      comportamiento3: '',
    });
    setEditingBase(null);
  };

  const handleOpenCreate = () => {
    if (!selectedAssessment) {
      showToast.error('Selecciona un assessment primero');
      return;
    }
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (base: Base) => {
    setEditingBase(base);
    setFormData({
      numeroBase: base.Numero_Base.toString(),
      nombre: base.Nombre_Base,
      competencia: base.Competencia_Base,
      descripcion: base.Descripcion_Base,
      comportamiento1: base.Comportamiento1_Base,
      comportamiento2: base.Comportamiento2_Base,
      comportamiento3: base.Comportamiento3_Base,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssessment) {
      showToast.error('Selecciona un assessment');
      return;
    }

    try {
      if (editingBase) {
        // Actualizar
        const response = await authFetch(
          '/api/base/update',
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              idBase: editingBase.ID_Base,
              nombre: formData.nombre,
              competencia: formData.competencia,
              descripcion: formData.descripcion,
              comportamiento1: formData.comportamiento1,
              comportamiento2: formData.comportamiento2,
              comportamiento3: formData.comportamiento3,
            }),
          },
          () => logout()
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al actualizar base');
        }

        showToast.success('Base actualizada exitosamente');
        
        // Actualizar la lista local
        setBases(bases.map(b => 
          b.ID_Base === editingBase.ID_Base 
            ? { ...b, ...formData, Nombre_Base: formData.nombre } 
            : b
        ));
      } else {
        // Crear
        const response = await authFetch(
          '/api/base/create',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({
              assessmentId: Number(selectedAssessment),
              numeroBase: Number(formData.numeroBase),
              nombre: formData.nombre,
              competencia: formData.competencia,
              descripcion: formData.descripcion,
              comportamiento1: formData.comportamiento1,
              comportamiento2: formData.comportamiento2,
              comportamiento3: formData.comportamiento3,
            }),
          },
          () => logout()
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Error al crear base');
        }

        const result = await response.json();
        showToast.success(`Base creada con ID: ${result.ID_Base}`);
        
        // Recargar bases
        const refreshResponse = await authFetch(
          `/api/base/list?assessmentId=${selectedAssessment}`,
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );
        if (refreshResponse.ok) {
          const refreshedBases = await refreshResponse.json();
          setBases(refreshedBases || []);
        }
      }

      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error en la operación';
      showToast.error(message);
    }
  };

  const handleDelete = async (baseId: number) => {
    if (!confirm('¿Estás seguro de eliminar esta base? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await authFetch(
        '/api/base/delete',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({ idBase: baseId }),
        },
        () => logout()
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar base');
      }

      showToast.success('Base eliminada exitosamente');
      setBases(bases.filter((b) => b.ID_Base !== baseId));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar base';
      showToast.error(message);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="custom" customColor="var(--color-accent)" />
        <p className="text-gray-600 text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      {/* Header */}
      <div className="w-full max-w-[1200px] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6 px-1 sm:px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Gestión de Bases</h1>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          <button
            onClick={() => router.push('/dashboard/config')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Volver a Config
          </button>
          <button
            onClick={logout}
            className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Selector de Assessment */}
      <div className="w-full max-w-[1200px] mb-6 px-1 sm:px-2">
        <div className="bg-white rounded-xl p-4 shadow border border-gray-100">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Selecciona un Assessment
          </label>
          <select
            value={selectedAssessment}
            onChange={(e) => setSelectedAssessment(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-base"
          >
            <option value="">-- Selecciona un assessment --</option>
            {assessments.map((assessment) => (
              <option key={assessment.id} value={assessment.id}>
                {assessment.nombre} (ID: {assessment.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botón Crear Base */}
      {selectedAssessment && (
        <div className="w-full max-w-[1200px] mb-4 px-1 sm:px-2">
          <button
            onClick={handleOpenCreate}
            className="w-full sm:w-auto bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-6 py-3 rounded-lg font-semibold transition shadow"
          >
            + Crear Nueva Base
          </button>
        </div>
      )}

      {/* Lista de Bases */}
      <div className="w-full max-w-[1200px] px-1 sm:px-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" color="custom" customColor="var(--color-accent)" />
            <span className="ml-3 text-gray-600">Cargando bases...</span>
          </div>
        ) : !selectedAssessment ? (
          <div className="text-center py-12 text-gray-500">
            <p>Selecciona un assessment para ver sus bases</p>
          </div>
        ) : bases.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay bases registradas para este assessment</p>
            <p className="text-sm mt-2">Haz clic en "Crear Nueva Base" para agregar una</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bases.map((base) => (
              <div
                key={base.ID_Base}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block bg-[color:var(--color-accent)] text-white text-xs font-bold px-2 py-1 rounded">
                      Base #{base.Numero_Base}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-2">
                      {base.Nombre_Base}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Competencia:</span> {base.Competencia_Base}
                  </p>
                  <p>
                    <span className="font-semibold">Descripción:</span> {base.Descripcion_Base}
                  </p>
                  <div className="border-t border-gray-200 pt-2 mt-3">
                    <p className="font-semibold text-gray-900 mb-1">Comportamientos:</p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>{base.Comportamiento1_Base}</li>
                      <li>{base.Comportamiento2_Base}</li>
                      <li>{base.Comportamiento3_Base}</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleOpenEdit(base)}
                    className="flex-1 bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(base.ID_Base)}
                    className="flex-1 bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingBase ? 'Editar Base' : 'Crear Nueva Base'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!editingBase && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-1">
                    Número de Base *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.numeroBase}
                    onChange={(e) => setFormData({ ...formData, numeroBase: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300"
                    placeholder="Ej: 1"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Nombre de la Base *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300"
                  placeholder="Ej: Liderazgo Transformacional"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Competencia *
                </label>
                <input
                  type="text"
                  required
                  value={formData.competencia}
                  onChange={(e) => setFormData({ ...formData, competencia: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300"
                  placeholder="Ej: Liderazgo"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  Descripción *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300"
                  placeholder="Describe la competencia a evaluar"
                />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900">Comportamientos *</p>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Comportamiento 1</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.comportamiento1}
                    onChange={(e) => setFormData({ ...formData, comportamiento1: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Comportamiento 2</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.comportamiento2}
                    onChange={(e) => setFormData({ ...formData, comportamiento2: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Comportamiento 3</label>
                  <textarea
                    required
                    rows={2}
                    value={formData.comportamiento3}
                    onChange={(e) => setFormData({ ...formData, comportamiento3: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-900 hover:bg-gray-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white transition"
                >
                  {editingBase ? 'Guardar Cambios' : 'Crear Base'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
