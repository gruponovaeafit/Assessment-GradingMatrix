"use client";

import { useRouter } from "next/navigation";

export default function InfoPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white px-4 py-8">
      <div className="w-full max-w-3xl mx-auto bg-white shadow-lg rounded-2xl px-8 py-10 border border-gray-100">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Información del Proyecto</h1>
        <p className="text-gray-600 text-base sm:text-lg mb-6">
          Assessment Grading Matrix es una plataforma para registrar participantes, administrar
          evaluadores y consolidar calificaciones por assessment. Está pensada para centralizar la
          gestión del proceso en un solo lugar.
        </p>

        <div className="space-y-4 text-gray-700 text-base sm:text-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">¿Qué puedes hacer?</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Crear y administrar assessments y grupos de assessment.</li>
              <li>Registrar calificadores y participantes.</li>
              <li>Asignar participantes a grupos específicos.</li>
              <li>Visualizar y exportar calificaciones.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Acceso</h2>
            <p>
              El registro de participantes está protegido y requiere iniciar sesión. Si necesitas acceso,
              solicita credenciales al administrador del assessment.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/auth/login")}
            className="rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-lg font-semibold py-3 px-6 transition shadow"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg bg-white border border-gray-300 hover:border-[color:var(--color-accent)] text-gray-800 text-lg font-semibold py-3 px-6 transition shadow"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
