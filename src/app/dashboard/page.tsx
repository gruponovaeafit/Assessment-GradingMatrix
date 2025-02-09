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
      <button className=" rounded-md bg-gray-300 bg-opacity-20 mb-8 text-xl p-5 font-bold"> Rotar Base </button>
      
      
      <div className="flex flex-col gap-4  max-w-[800px] rounded-md p-4 bg-gray-50 bg-opacity-10">
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
            <tr>
              
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Grupo 1</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Juan Perez</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">95</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aprobado</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <p>Calificador 1</p>
                <p>Calificador 2</p>
              </td>
             
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Grupo 2</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Maria Lopez</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">88</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aprobado</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <p>Calificador 1</p>
                <p>Calificador 2</p>
              </td>
            </tr>
            
          </tbody>
        </table>
      </div>
    </div>
  );
} 