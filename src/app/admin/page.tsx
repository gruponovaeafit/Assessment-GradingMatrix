"use client";

import { useEffect } from "react";
import { useAdminAuth } from "../Hooks/useAdminAuth";
import { Spinner } from "../components/UI/Loading";

export default function AdminHub() {
  const { isAdmin, isLoading: authLoading, requireAdmin, logout } = useAdminAuth();

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="custom" customColor="var(--color-accent)" />
        <p className="text-[color:var(--color-text)] text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen py-6 px-4 bg-white">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Admin</h1>
        <button
          onClick={logout}
          className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl shadow p-5 flex flex-col gap-3">
          <h2 className="text-xl font-bold text-gray-900">Gestión del Assessment</h2>
          <p className="text-sm text-gray-600">
            Administra personas del assessment, revisa calificaciones y exporta resultados.
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard/gh")}
            className="mt-2 w-full bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Ir a Gestión
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow p-5 flex flex-col gap-3">
          <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
          <p className="text-sm text-gray-600">
            Crea assessments, activa/inactiva, registra calificadores y asigna grupos.
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard/config")}
            className="mt-2 w-full bg-success hover:bg-success-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Ir a Configuración
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl shadow p-5 flex flex-col gap-3 md:col-span-2">
          <h2 className="text-xl font-bold text-gray-900">Rotaciones</h2>
          <p className="text-sm text-gray-600">
            Administra el grupo asignado a cada calificador y el contador de rotaciones.
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard/rotations")}
            className="mt-2 w-full bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Ir a Rotaciones
          </button>
        </div>
      </div>
    </div>
  );
}
