"use client";
import { useEffect, useState } from 'react';

interface Calificacion {
  Grupo: string;
  ID: number;
  Participante: string;
  Correo: string;
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
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-[linear-gradient(210deg,#135ce3,#8c4fd5,#ff296e,#d9448f,#b25faf)]">
  <h1 className="text-2xl font-bold mb-8 mt-[20]">Panel de Calificaciones</h1>
    
    <div className="flex flex-col gap-4 max-w-[800px] w-[350] rounded-md p-4 bg-gray-500 bg-opacity-20">
      {data.map((item, index) => (
        <div key={index} className="flex flex-col gap-2 p-4 bg-white bg-opacity-5 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-white">{item.Participante}</h2>
          
          <div className="text-white text-sm">
            
            <p><span className="font-bold text-violet-700 text-lg mr-[5]">ID:</span> {item.ID}</p>
            <p><span className="font-bold text-violet-700 text-lg mr-[5]">Grupo:</span> {item.Grupo}</p>
            <p><span className="font-bold text-violet-700 text-lg mr-[5]">Correo:</span> {item.Correo}</p>
            <p><span className="font-bold text-violet-700 text-lg mr-[5]">Promedio:</span> {item.Calificacion_Promedio.toFixed(2)}</p>
            <p>
              <span className="font-bold text-violet-700 text-lg mr-[5]">Estado:</span> 
              <span className={item.Calificacion_Promedio < 4 ? 'text-red-500' : 'text-green-500'}>
                {item.Estado}
              </span>
            </p>
           
          </div>
        </div>
      ))}
    </div>
    <footer className="mb-[20] w-full text-xl text-center mt-20 m-[0] italic">
       POWERED BY <span className="font-bold text-3xl text-violet-700">Nova</span>
     </footer>
  </div>
  );
} 
