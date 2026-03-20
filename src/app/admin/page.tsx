"use client";

import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Box } from "@/components/UI/Box";
import { Button } from "@/components/UI/Button";

export default function AdminHub() {
  const { logout } = useAdminAuth();

  return (
    // Fondo gris claro general
    <div className="flex flex-col items-center min-h-screen py-6 px-4 bg-gray-100">

      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">

        {/* Título principal */}
        <h1 className="text-3xl drop-shadow-[3px_4px_1.5px_rgba(0,0,0,0)] font-extrabold text-[color:var(--color-accent)]">
          Admin
        </h1>

        {/* Botón cerrar sesión */}
        <Button variant="error" onClick={logout} className="flex items-center gap-2">
          Cerrar Sesión
          <img src="/LogoutIcon.svg" alt="logout" className="w-5 h-5" />
        </Button>

      </div>

      {/* Grid de cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-10">

        {/* Card */}
        <Box className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-gray-900">Gestión del Assessment</h2>
          <p className="text-sm text-gray-600">
            Administra personas del assessment, revisa calificaciones y exporta resultados.
          </p>
          {/* Botón de navegación */}
          <Button
            variant="accent"
            className="mt-2 w-full"
            onClick={() => (window.location.href = "/admin/management")}
          >
            Ir a Gestión
          </Button>
        </Box>

        <Box className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
          <p className="text-sm text-gray-600">
            Crea assessments, activa/inactiva, registra calificadores y asigna grupos.
          </p>
          <Button
            variant="accent"
            className="mt-2 w-full"
            onClick={() => (window.location.href = "/admin/configuration")}
          >
            Ir a Configuración
          </Button>
        </Box>

        <Box className="flex flex-col gap-3 md:col-span-2">
          <h2 className="text-xl font-bold text-gray-900">Gestionar Bases</h2>
          <p className="text-sm text-gray-600">
            Administra las bases del assessment: define criterios, rangos de clasificación y valores.
          </p>
          <Button
            variant="accent"
            className="mt-2 w-full"
            onClick={() => (window.location.href = "/admin/bases")}
          >
            Ir a Bases
          </Button>
        </Box>

      </div>
    </div>
  );
}