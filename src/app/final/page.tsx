"use client";
import { useEffect, useState } from "react";
import { useAdminAuth } from "../Hooks/useAdminAuth";

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
  const { isAdmin, isLoading: authLoading, requireAdmin, logout } = useAdminAuth();
  const [data, setData] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [editModal, setEditModal] = useState<Calificacion | null>(null);
  const [originalData, setOriginalData] = useState<Calificacion | null>(null);

  // Proteger la ruta - redirige si no es admin
  useEffect(() => {
    requireAdmin();
  }, [isAdmin, authLoading]);

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

    const updates: Record<string, string | number> = { id: editModal.ID };
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

  // Función para determinar el estado y color según el promedio
  const getEstadoInfo = (promedio: number | null) => {
    if (promedio == null) {
      return { texto: "Pendiente", color: "text-white/60" };
    }
    if (promedio >= 4.7) {
      return { texto: "✅ Pasa al grupo", color: "text-success" };
    }
    if (promedio >= 4) {
      return { texto: "📋 Pasa a entrevista", color: "text-success-light" };
    }
    if (promedio >= 3.599) {
      return { texto: "⚠️ Pasa a discusión", color: "text-yellow-400" };
    }
    return { texto: "❌ No pasa", color: "text-error" };
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-2 sm:px-4 bg-cover bg-center gradient_purple"
    >
      {/* Header con título y botón logout */}
      <div className="w-full max-w-7xl flex justify-between items-center mb-4 sm:mb-8 px-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Panel de Calificaciones</h1>
        <button
          onClick={logout}
          className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Cerrar Sesión
        </button>
      </div>
      {mensaje && (
        <p className="mb-4 sm:mb-6 text-base sm:text-lg font-medium text-center text-white bg-black/40 px-4 py-2 rounded">
          {mensaje}
        </p>
      )}
      
      {/* Vista móvil: cards */}
      <div className="block lg:hidden w-full max-w-md space-y-4">
        {data.map((item) => (
          <div key={item.ID} className="bg-white/20 backdrop-blur-md rounded-xl p-4 text-white">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={item.Foto && item.Foto.trim() !== "" ? item.Foto : "/userdefault.png"}
                alt={item.Participante}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== window.location.origin + "/userdefault.png") {
                    target.src = "/userdefault.png";
                  }
                }}
              />
              <div>
                <p className="font-bold text-sm">{item.Participante}</p>
                <p className="text-xs text-white/80 truncate max-w-[180px]">{item.Correo}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <p><span className="font-bold">Rol:</span> {item.role === "1" ? "Infiltrado" : item.role === "0" ? "Aspirante" : item.role}</p>
              <p><span className="font-bold">Grupo:</span> {item.Grupo}</p>
            </div>
            <div className="grid grid-cols-5 gap-1 text-xs text-center mb-3">
              <div><span className="block text-white/60">B1</span>{item.Calificacion_Base_1?.toFixed(1) ?? "-"}</div>
              <div><span className="block text-white/60">B2</span>{item.Calificacion_Base_2?.toFixed(1) ?? "-"}</div>
              <div><span className="block text-white/60">B3</span>{item.Calificacion_Base_3?.toFixed(1) ?? "-"}</div>
              <div><span className="block text-white/60">B4</span>{item.Calificacion_Base_4?.toFixed(1) ?? "-"}</div>
              <div><span className="block text-white/60">B5</span>{item.Calificacion_Base_5?.toFixed(1) ?? "-"}</div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <span className="font-bold text-sm">Promedio: </span>
                <span className="font-bold">{item.Calificacion_Promedio?.toFixed(2) ?? "N/A"}</span>
                <span className={`ml-2 text-xs ${getEstadoInfo(item.Calificacion_Promedio).color}`}>
                  {getEstadoInfo(item.Calificacion_Promedio).texto}
                </span>
              </div>
              <button
                className="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-primary-light transition"
                onClick={() => {
                  setEditModal({ ...item });
                  setOriginalData({ ...item });
                }}
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Vista desktop: tabla */}
      <div className="hidden lg:block overflow-x-auto w-full max-w-7xl rounded-2xl bg-black/40 shadow-lg backdrop-blur-md">
        <table className="min-w-full border-collapse rounded-xl overflow-hidden">
          <thead>
            <tr className="bg-primary-dark text-white">
              <th className="p-2 sm:p-3 text-left text-sm">Foto</th>
              <th className="p-2 sm:p-3 text-left text-sm">Nombre</th>
              <th className="p-2 sm:p-3 text-left text-sm">Correo</th>
              <th className="p-2 sm:p-3 text-left text-sm">Rol</th>
              <th className="p-2 sm:p-3 text-left text-sm">Grupo</th>
              <th className="p-2 sm:p-3 text-left text-sm">B1</th>
              <th className="p-2 sm:p-3 text-left text-sm">B2</th>
              <th className="p-2 sm:p-3 text-left text-sm">B3</th>
              <th className="p-2 sm:p-3 text-left text-sm">B4</th>
              <th className="p-2 sm:p-3 text-left text-sm">B5</th>
              <th className="p-2 sm:p-3 text-left text-sm">Promedio</th>
              <th className="p-2 sm:p-3 text-left text-sm">Estado</th>
              <th className="p-2 sm:p-3 text-left text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={item.ID}
                className="border-b border-white/20 hover:bg-white/30 transition text-white bg-white/10"
              >
                <td className="p-2">
                  <img
                    src={item.Foto && item.Foto.trim() !== "" ? item.Foto : "/userdefault.png"}
                    alt={item.Participante}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== window.location.origin + "/userdefault.png") {
                        target.src = "/userdefault.png";
                      }
                    }}
                  />
                </td>
                <td className="p-2 font-semibold text-sm">{item.Participante}</td>
                <td className="p-2 text-sm">{item.Correo}</td>
                <td className="p-2 text-sm">
                  {item.role === "1" ? "Infiltrado" : item.role === "0" ? "Aspirante" : item.role}
                </td>
                <td className="p-2 text-sm">{item.Grupo}</td>
                <td className="p-2 text-center text-sm">
                  {item.Calificacion_Base_1 != null ? item.Calificacion_Base_1.toFixed(2) : "-"}
                </td>
                <td className="p-2 text-center text-sm">
                  {item.Calificacion_Base_2 != null ? item.Calificacion_Base_2.toFixed(2) : "-"}
                </td>
                <td className="p-2 text-center text-sm">
                  {item.Calificacion_Base_3 != null ? item.Calificacion_Base_3.toFixed(2) : "-"}
                </td>
                <td className="p-2 text-center text-sm">
                  {item.Calificacion_Base_4 != null ? item.Calificacion_Base_4.toFixed(2) : "-"}
                </td>
                <td className="p-2 text-center text-sm">
                  {item.Calificacion_Base_5 != null ? item.Calificacion_Base_5.toFixed(2) : "-"}
                </td>
                <td className="p-2 font-bold text-center text-sm">
                  {item.Calificacion_Promedio != null ? item.Calificacion_Promedio.toFixed(2) : "N/A"}
                </td>
                <td className="p-2 font-bold text-center text-sm">
                  <span className={getEstadoInfo(item.Calificacion_Promedio).color}>
                    {getEstadoInfo(item.Calificacion_Promedio).texto}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <button
                    className="bg-primary text-white px-3 py-1 rounded hover:bg-primary-light transition text-sm"
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
              <select
                value={editModal.role}
                onChange={(e) => setEditModal({ ...editModal, role: e.target.value })}
                className="w-full border-2 border-primary px-3 py-2 rounded mb-4 text-black bg-white text-sm sm:text-base"
              >
                <option value="0">Aspirante</option>
                <option value="1">Infiltrado</option>
              </select>

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
