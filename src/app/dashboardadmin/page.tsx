"use client";
import { useEffect, useState } from 'react';
import { useAdminAuth } from '../Hooks/useAdminAuth';

interface Calificacion {
  Grupo: string;
  ID: number;
  Participante: string;
  Correo: string;
  role: string;
  Calificacion_Promedio: number;
  Estado: string;
}

export default function Dashboard() {
  const { isAdmin, isLoading: authLoading, requireAdmin, logout } = useAdminAuth();
  const [data, setData] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [editModal, setEditModal] = useState<Calificacion | null>(null);
  const [originalData, setOriginalData] = useState<Calificacion | null>(null);

  // Proteger la ruta - redirige si no es admin
  useEffect(() => {
    requireAdmin();
  }, [isAdmin, authLoading]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboardadmin');
        if (!response.ok) throw new Error('Error al cargar los datos');
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal || !originalData) return;

  const updates: Record<string, string | number> = { id: editModal.ID };
    if (editModal.Participante !== originalData.Participante) updates.nombre = editModal.Participante;
    if (editModal.Correo !== originalData.Correo) updates.correo = editModal.Correo;
    if (editModal.role !== originalData.role) updates.role = editModal.role;

    if (Object.keys(updates).length === 1) {
      setMensaje("❌ Error: Debe modificarse al menos un campo");
      return;
    }

    const res = await fetch('/api/update-person', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    const result = await res.json();
    if (res.ok) {
      setMensaje('✅ Participante actualizado correctamente');
      setData((prev) =>
        prev.map((p) => (p.ID === editModal.ID ? editModal : p))
      );
      setEditModal(null);
      setOriginalData(null);
    } else {
      setMensaje(`❌ Error: ${result.error}`);
    }
  };

  // Mostrar loading mientras verifica autenticación
  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen gradient_purple">
        <p className="text-white text-xl">Verificando acceso...</p>
      </div>
    );
  }

  if (loading) return <p className="text-center mt-20 text-white">Cargando datos...</p>;
  if (error) return <p className="text-center mt-20 text-error">{error}</p>;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-4 bg-cover bg-center gradient_purple"
    >
      {/* Header con título y botón logout */}
      <div className="w-full max-w-[900px] flex justify-between items-center mb-4 px-2">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Panel de Calificaciones</h1>
        <button
          onClick={logout}
          className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Cerrar Sesión
        </button>
      </div>

      {mensaje && (
        <p className="mt-4 text-base sm:text-lg font-medium text-center text-white bg-black/40 px-4 py-2 rounded">
          {mensaje}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-4 max-w-[900px] w-full rounded-md p-2 sm:p-4 mt-4">
        {data.map((item) => (
          <div
            key={item.ID}
            className="flex flex-col justify-center items-center text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg bg-cover bg-center"
            style={{
              backgroundImage: "url('/marcoH.svg')",
              width: '100%',
              maxWidth: '320px',
              minHeight: '240px',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
            }}
          >
            <div className="w-full flex justify-center mb-2">
              <h2 className="text-xs sm:text-sm font-bold text-white text-center w-full leading-tight">
                {item.Participante}
              </h2>
            </div>

            <div className="w-full flex justify-center mb-2">
              <div className="border-t border-white/50" style={{ width: '95%' }} />
            </div>

            <div className="text-left w-full leading-5 sm:leading-6 text-xs sm:text-sm">
              <p><span className="font-bold">ID:</span> {item.ID}</p>
              <p><span className="font-bold">Grupo:</span> {item.Grupo}</p>
              <p className="truncate"><span className="font-bold">Correo:</span> {item.Correo}</p>
              <p><span className="font-bold">Rol:</span> {item.role}</p>
              <p>
                <span className="font-bold">Promedio:</span>{" "}
                {item.Calificacion_Promedio != null
                  ? item.Calificacion_Promedio.toFixed(2)
                  : "Sin calificación"}
              </p>
              <p>
                <span className="font-bold">Estado:</span>{' '}
                <span className={item.Calificacion_Promedio < 4 ? 'text-error' : 'text-success'}>
                  {item.Estado}
                </span>
              </p>
            </div>

            <button
              onClick={() => {
                setEditModal({ ...item });
                setOriginalData({ ...item });
              }}
              className="mt-2 text-xs sm:text-sm bg-primary hover:bg-primary-light text-white px-3 sm:px-4 py-1 rounded"
            >
              Editar
            </button>
          </div>
        ))}
      </div>

      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-primary-dark rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold mb-4 text-white">Editar Participante</h2>
            <form onSubmit={handleUpdate}>
              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Nombre</label>
              <input
                type="text"
                value={editModal.Participante}
                onChange={(e) => setEditModal({ ...editModal, Participante: e.target.value })}
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white placeholder-gray-500 text-sm sm:text-base"
              />

              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Correo</label>
              <input
                type="email"
                value={editModal.Correo}
                onChange={(e) => setEditModal({ ...editModal, Correo: e.target.value })}
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white placeholder-gray-500 text-sm sm:text-base"
              />

              <label className="block mb-2 font-semibold text-white text-sm sm:text-base">Rol</label>
              <input
                type="text"
                value={editModal.role}
                onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white placeholder-gray-500 text-sm sm:text-base"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditModal(null);
                    setOriginalData(null);
                  }}
                  className="px-3 sm:px-4 py-2 rounded bg-white/80 text-black hover:bg-white text-sm sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 sm:px-4 py-2 rounded bg-success text-white hover:bg-success-dark text-sm sm:text-base"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
