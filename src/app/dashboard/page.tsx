"use client";
import { useEffect, useState } from 'react';

interface Calificacion {
  Grupo: string;
  Participante: string;
  Calificacion_Promedio: number;
  Estado: string;
}

export default function Dashboard() {
  const [data, setData] = useState<Calificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <p className="text-center mt-20">Cargando datos...</p>;
  if (error) return <p className="text-center mt-20 text-red-500">{error}</p>;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Panel de Calificaciones</h1>

      <div className="flex flex-col gap-4 max-w-[800px] rounded-md p-4 bg-gray-50 bg-opacity-10">
        <table className="min-w-full divide-y divide-gray-200 bg-opacity-50 rounded-md">
          <thead className="bg-gray-50 bg-opacity-20">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Grupo</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Participante</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Calificación Promedio</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 rounded-md">
            {data.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.Grupo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Participante}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Calificacion_Promedio.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 