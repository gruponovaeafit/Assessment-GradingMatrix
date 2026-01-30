"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../../Hooks/useAdminAuth";
import { Spinner, SkeletonTableRow, Skeleton } from "../../components/UI/Loading";
import { showToast } from "../../components/UI/Toast";
import { authFetch } from "@/lib/authFetch";

type StaffRow = {
  id: number;
  correo: string;
  rol: string;
  assessmentId: number;
  grupoId: number | null;
  grupoNombre: string | null;
  rotaciones: number;
};

type GrupoItem = { id: number; nombre: string };

export default function RotationsDashboard() {
  const { isAdmin, isLoading: authLoading, requireAdmin, logout, getAuthHeaders } = useAdminAuth();

  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<{ id: number; nombre: string; activo: boolean }[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [groups, setGroups] = useState<GrupoItem[]>([]);
  const [editModal, setEditModal] = useState<StaffRow | null>(null);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const loadAssessments = async () => {
      try {
        const res = await authFetch(
          "/api/assessment/list",
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );
        if (!res.ok) throw new Error("Error al cargar assessments");
        const data = await res.json();
        setAssessments(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadAssessments();
  }, [authLoading, isAdmin, getAuthHeaders]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const loadStaff = async () => {
      try {
        const query = selectedAssessment ? `?assessmentId=${selectedAssessment}` : "";
        const res = await authFetch(
          `/api/dashboard/rotations${query}`,
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );
        if (!res.ok) {
          const payload = await res.json();
          throw new Error(payload?.error || "Error al cargar datos");
        }
        const data = await res.json();
        setStaff(data || []);
        setLoading(false);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Error al cargar datos";
        setError(message);
        setLoading(false);
      }
    };
    loadStaff();
  }, [authLoading, isAdmin, selectedAssessment, getAuthHeaders]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    if (!selectedAssessment) {
      setGroups([]);
      return;
    }
    const loadGroups = async () => {
      try {
        const res = await authFetch(
          `/api/assessment/groups?assessmentId=${selectedAssessment}`,
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );
        if (!res.ok) throw new Error("Error al cargar grupos");
        const data = await res.json();
        setGroups(data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadGroups();
  }, [authLoading, isAdmin, selectedAssessment, getAuthHeaders]);

  const filteredStaff = useMemo(() => {
    const shows = staff.filter((item) => item.rol === "calificador");
    if (!searchTerm) return shows;
    const term = searchTerm.toLowerCase();
    return shows.filter(
      (item) =>
        item.correo.toLowerCase().includes(term) ||
        String(item.id).includes(term) ||
        String(item.grupoId ?? "").includes(term)
    );
  }, [staff, searchTerm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;

    try {
      setSaving(true);
      const res = await authFetch(
        "/api/staff/update-rotation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            staffId: editModal.id,
            grupoAssessmentId: editModal.grupoId,
            rotaciones: editModal.rotaciones,
          }),
        },
        () => logout()
      );
      const data = await res.json();
      if (!res.ok) ensureNoAuth(data?.error || "Error al actualizar");
      setStaff((prev) =>
        prev.map((s) => (s.id === editModal.id ? { ...s, ...data } : s))
      );
      showToast.success("Rotación actualizada");
      setEditModal(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al actualizar";
      showToast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const ensureNoAuth = (message: string) => {
    if (message.toLowerCase().includes("no autorizado")) {
      logout();
    }
    throw new Error(message);
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="var(--color-accent)" />
        <p className="text-[color:var(--color-text)] text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
        <div className="w-full max-w-6xl flex justify-between items-center mb-4 sm:mb-8 px-2">
          <Skeleton className="h-7 w-64" />
        </div>
        <div className="hidden lg:block w-full max-w-6xl bg-white shadow rounded-xl overflow-hidden border border-gray-100">
          <div className="p-4 border-b border-white/20">
            <Skeleton className="h-6 w-48" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonTableRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <p className="text-error text-xl">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-[color:var(--color-accent)] hover:text-white"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-4 sm:py-8 px-3 sm:px-4 bg-white">
      <div className="w-full max-w-6xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 px-1 sm:px-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 text-center sm:text-left">
          Rotaciones de Calificadores
        </h1>
        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          <button
            onClick={() => (window.location.href = "/admin")}
            className="bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Admin
          </button>
          <button
            onClick={logout}
            className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl mb-4 px-1 sm:px-2">
        <div className="bg-white shadow rounded-xl p-4 space-y-4 border border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedAssessment}
              onChange={(e) => setSelectedAssessment(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 focus:border-[color:var(--color-accent)] focus:outline-none text-base"
            >
              <option value="">Todos los assessments</option>
              {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.nombre} {assessment.activo ? "(Activo)" : "(Inactivo)"}
                </option>
              ))}
            </select>

            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar por correo, ID o grupo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white text-gray-900 placeholder-gray-400 border border-gray-300 focus:border-[color:var(--color-accent)] focus:outline-none transition text-base"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:block overflow-x-auto w-full max-w-6xl rounded-2xl bg-white shadow-lg border border-gray-100">
        <table className="min-w-full border-collapse rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-[color:var(--color-accent)] text-white">
              <th className="p-3 text-left text-sm">ID</th>
              <th className="p-3 text-left text-sm">Correo</th>
              <th className="p-3 text-left text-sm">Assessment</th>
              <th className="p-3 text-left text-sm">Grupo</th>
              <th className="p-3 text-left text-sm">Rotaciones</th>
              <th className="p-3 text-left text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.map((item) => (
              <tr
                key={item.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition text-gray-900 bg-white"
              >
                <td className="p-3 font-semibold">{item.id}</td>
                <td className="p-3">{item.correo}</td>
                <td className="p-3">{item.assessmentId}</td>
                <td className="p-3">
                  {item.grupoNombre ?? (item.grupoId ? `Grupo ${item.grupoId}` : "Sin grupo")}
                </td>
                <td className="p-3">{item.rotaciones ?? 0}</td>
                <td className="p-3">
                  <button
                    className="bg-[color:var(--color-accent)] text-white px-4 py-2 rounded text-sm hover:bg-[#5B21B6] transition shadow"
                    onClick={() => {
                      if (String(item.assessmentId) !== selectedAssessment) {
                        setSelectedAssessment(String(item.assessmentId));
                      }
                      setEditModal({ ...item });
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {filteredStaff.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No hay calificadores para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="block lg:hidden w-full max-w-md space-y-4">
        {filteredStaff.map((item) => (
          <div key={item.id} className="bg-white shadow rounded-xl p-4 border border-gray-100">
            <p className="text-sm text-gray-500">ID #{item.id}</p>
            <p className="font-semibold text-gray-900 truncate">{item.correo}</p>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <p>
                <span className="font-semibold">Assessment:</span> {item.assessmentId}
              </p>
              <p>
                <span className="font-semibold">Grupo:</span>{" "}
                {item.grupoNombre ?? (item.grupoId ? `Grupo ${item.grupoId}` : "Sin grupo")}
              </p>
              <p>
                <span className="font-semibold">Rotaciones:</span> {item.rotaciones ?? 0}
              </p>
            </div>
            <button
              className="mt-3 bg-[color:var(--color-accent)] text-white px-4 py-2 rounded text-sm hover:bg-[#5B21B6] transition shadow w-full"
              onClick={() => {
                if (String(item.assessmentId) !== selectedAssessment) {
                  setSelectedAssessment(String(item.assessmentId));
                }
                setEditModal({ ...item });
              }}
            >
              Editar
            </button>
          </div>
        ))}
      </div>

      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-primary-dark rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">Editar Rotación</h2>
            <form onSubmit={handleSave}>
              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Grupo</label>
              <select
                value={editModal.grupoId ?? ""}
                onChange={(e) =>
                  setEditModal({
                    ...editModal,
                    grupoId: e.target.value ? Number(e.target.value) : null,
                    grupoNombre:
                      groups.find((g) => g.id === Number(e.target.value))?.nombre ?? null,
                  })
                }
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white text-sm sm:text-base"
              >
                <option value="">Sin grupo</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.nombre}
                  </option>
                ))}
              </select>

              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">
                Rotaciones
              </label>
              <input
                type="number"
                min={0}
                value={editModal.rotaciones ?? 0}
                onChange={(e) =>
                  setEditModal({ ...editModal, rotaciones: Number(e.target.value) })
                }
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white text-sm sm:text-base"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModal(null)}
                  className="px-3 sm:px-4 py-2 rounded bg-white/80 text-black hover:bg-white text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 sm:px-4 py-2 rounded bg-success text-white hover:bg-success-dark text-sm sm:text-base disabled:opacity-60"
                >
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
