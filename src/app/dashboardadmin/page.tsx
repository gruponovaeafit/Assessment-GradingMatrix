"use client";
import { useEffect, useState } from 'react';

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
  const [data, setData] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [editModal, setEditModal] = useState<Calificacion | null>(null);
  const [originalData, setOriginalData] = useState<Calificacion | null>(null);

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

    const updates: any = { id: editModal.ID };
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

  if (loading) return <p className="text-center mt-20">Cargando datos...</p>;
  if (error) return <p className="text-center mt-20 text-red-500">{error}</p>;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen py-2 bg-cover bg-center"
      style={{ backgroundImage: "url('/rosamorado.svg')" }}
    >
      <h1 className="text-2xl font-bold mt-6 text-white">Panel de Calificaciones</h1>

      {mensaje && (
        <p className="mt-4 text-lg font-medium text-center text-white bg-black/40 px-4 py-2 rounded">
          {mensaje}
        </p>
      )}

      <div className="flex flex-col gap-4 max-w-[800px] w-[350] rounded-md p-4 mt-4">
        {data.map((item) => (
          <div
            key={item.ID}
            className="flex flex-col justify-center items-center text-white px-6 py-4 rounded-lg bg-cover bg-center"
            style={{
              backgroundImage: "url('/marcoH.svg')",
              width: '340px',
              height: '260px',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '0% center',
            }}
          >
            <div className="w-full flex justify-center mb-">
              <h2 className="text-sm font-bold text-white text-center w-[100%] leading-tight">
                {item.Participante}
              </h2>
            </div>

            <div className="w-full flex justify-center mb-2">
              <div className="border-t border-white/50" style={{ width: '95%' }} />
            </div>

            <div className="text-left w-full leading-6 text-sm">
              <p><span className="font-bold">ID:</span> {item.ID}</p>
              <p><span className="font-bold">Grupo:</span> {item.Grupo}</p>
              <p><span className="font-bold">Correo:</span> {item.Correo}</p>
              <p><span className="font-bold">Rol:</span> {item.role}</p>
              <p><span className="font-bold">Promedio:</span> {item.Calificacion_Promedio.toFixed(2)}</p>
              <p>
                <span className="font-bold">Estado:</span>{' '}
                <span className={item.Calificacion_Promedio < 4 ? 'text-red-400' : 'text-green-400'}>
                  {item.Estado}
                </span>
              </p>
            </div>

            <button
              onClick={() => {
                setEditModal({ ...item });
                setOriginalData({ ...item });
              }}
              className="mt-2 text-sm bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
            >
              Editar
            </button>
          </div>
        ))}
      </div>

      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-purple-800 rounded-lg p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-bold mb-4 text-white">Editar Participante</h2>
            <form onSubmit={handleUpdate}>
              <label className="block mb-2 font-semibold text-white">Nombre</label>
              <input
                type="text"
                value={editModal.Participante}
                onChange={(e) => setEditModal({ ...editModal, Participante: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 rounded mb-4 text-black placeholder-black"
              />

              <label className="block mb-2 font-semibold text-white">Correo</label>
              <input
                type="email"
                value={editModal.Correo}
                onChange={(e) => setEditModal({ ...editModal, Correo: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 rounded mb-4 text-black placeholder-black"
              />

              <label className="block mb-2 font-semibold text-white">Rol</label>
              <input
                type="text"
                value={editModal.role}
                onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
                className="w-full border border-gray-300 px-3 py-2 rounded mb-4 text-black placeholder-black"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditModal(null);
                    setOriginalData(null);
                  }}
                  className="px-4 py-2 rounded bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
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
