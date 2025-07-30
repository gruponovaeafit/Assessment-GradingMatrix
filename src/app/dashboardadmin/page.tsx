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
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-cover bg-center"
  style={{ backgroundImage: "url('/rosamorado.svg')" }} >

  <h1 className="text-2xl font-bold mt-[20]">Panel de Calificaciones</h1>
    
    <div className="flex flex-col gap-4 max-w-[800px] w-[350] rounded-md p-4">
      {data.map((item, index) => (
        <div
          key={index}
          className="flex flex-col justify-center items-center text-white px-6 py-4 rounded-lg bg-cover bg-center"
          style={{
            backgroundImage: "url('/marcoH.svg')",
            width: '340px',
            height: '240px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0% center',
          }}
        >

          <div className="w-full flex justify-center mb-2" style={{ marginLeft: '-%' }}>
            <h2 className="text-xl font-bold text-white text-center w-[90%] leading-tight">
              {item.Participante}
            </h2>
          </div>

        <div className="w-full flex justify-center mb-2">
          <div className="border-t border-white/50" style={{ width: '95%', marginLeft: '-9%' }} />
        </div>
          <div className="text-left w-full leading-6">
            <p><span className="font-bold">Id:</span> {item.ID}</p>
            <p><span className="font-bold">Grupo:</span> {item.Grupo}</p>
            <p><span className="font-bold">Correo:</span> {item.Correo}</p>
            <p><span className="font-bold">Promedio:</span> {item.Calificacion_Promedio.toFixed(2)}</p>
            <p>
              <span className="font-bold">Estado:</span>{' '}
              <span className={item.Calificacion_Promedio < 4 ? 'text-red-400' : 'text-green-400'}>
                {item.Estado}
              </span>
            </p>
          </div>
        </div>
 
      ))}
    </div>
  </div>
  );
} 
