"use client";
import { useEffect, useState } from "react";

interface Calificacion {
  ID: number;
  Grupo: string;
  Participante: string;
  Correo: string;
  role: string;
  Foto?: string | null; // Permitimos undefined/null
  Calificacion_Promedio: number | null;
  Estado: string;
  Calificacion_Base_1?: number | null;
  Calificacion_Base_2?: number | null;
  Calificacion_Base_3?: number | null;
  Calificacion_Base_4?: number | null;
  Calificacion_Base_5?: number | null;
}

export default function DashboardTabla() {
  const [data, setData] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [editModal, setEditModal] = useState<Calificacion | null>(null);
  const [originalData, setOriginalData] = useState<Calificacion | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/final");
        if (!response.ok) throw new Error("Error al cargar los datos");
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError("Error al cargar los datos");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(""), 4000);
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

    const res = await fetch("/api/update-person", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    const result = await res.json();
    if (res.ok) {
      setMensaje("✅ Participante actualizado correctamente");
      setData((prev) =>
        prev.map((p) => (p.ID === editModal.ID ? { ...p, ...editModal } : p))
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
      className="flex flex-col items-center justify-center min-h-screen py-8 bg-cover bg-center"
      style={{ backgroundImage: "url('/rosamorado.svg')" }}
    >
      <h1 className="text-3xl font-bold mb-8 text-white">Panel de Calificaciones</h1>
      {mensaje && (
        <p className="mb-6 text-lg font-medium text-center text-white bg-black/40 px-4 py-2 rounded">
          {mensaje}
        </p>
      )}
      <div className="overflow-x-auto w-full max-w-7xl rounded-2xl bg-white/30 shadow-lg backdrop-blur-md">
        <table className="min-w-full border-collapse rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-purple-800 text-white">
              <th className="p-3 text-left">Foto</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-left">Correo</th>
              <th className="p-3 text-left">Rol</th>
              <th className="p-3 text-left">Grupo</th>
              <th className="p-3 text-left">Base 1</th>
              <th className="p-3 text-left">Base 2</th>
              <th className="p-3 text-left">Base 3</th>
              <th className="p-3 text-left">Base 4</th>
              <th className="p-3 text-left">Base 5</th>
              <th className="p-3 text-left">Promedio Final</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.ID}
                className="border-b border-purple-200 hover:bg-purple-50/70 transition"
              >
                <td className="p-2">
                  <img
                    src={item.Foto && item.Foto.trim() !== "" ? item.Foto : "/userdefault.png"}
                    alt={item.Participante}
                    className="w-80 h-40 rounded-full object-cover border-2 border-white shadow"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== window.location.origin + "/userdefault.png") {
                        target.src = "/userdefault.png";
                      }
                    }}
                  />
                </td>
                <td className="p-2 font-semibold">{item.Participante}</td>
                <td className="p-2">{item.Correo}</td>
                <td className="p-2">{item.role}</td>
                <td className="p-2">{item.Grupo}</td>
                <td className="p-2 text-center">
                  {item.Calificacion_Base_1 != null
                    ? item.Calificacion_Base_1.toFixed(2)
                    : "-"}
                </td>
                <td className="p-2 text-center">
                  {item.Calificacion_Base_2 != null
                    ? item.Calificacion_Base_2.toFixed(2)
                    : "-"}
                </td>
                <td className="p-2 text-center">
                  {item.Calificacion_Base_3 != null
                    ? item.Calificacion_Base_3.toFixed(2)
                    : "-"}
                </td>
                <td className="p-2 text-center">
                  {item.Calificacion_Base_4 != null
                    ? item.Calificacion_Base_4.toFixed(2)
                    : "-"}
                </td>
                <td className="p-2 text-center">
                  {item.Calificacion_Base_5 != null
                    ? item.Calificacion_Base_5.toFixed(2)
                    : "-"}
                </td>
                <td className="p-2 font-bold text-center">
                  {item.Calificacion_Promedio != null
                    ? item.Calificacion_Promedio.toFixed(2)
                    : "Sin calificación"}
                </td>
                <td className="p-2 font-bold text-center">
                  <span
                    className={
                      item.Calificacion_Promedio != null && item.Calificacion_Promedio < 4
                        ? "text-red-500"
                        : "text-green-500"
                    }
                  >
                    {item.Estado}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                    onClick={() => {
                      setEditModal({ ...item });
                      setOriginalData({ ...item });
                    }}
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para editar */}
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
