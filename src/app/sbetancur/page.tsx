"use client";
import Image from "next/image";
import '../sbetancur/styles.css';
import { useRouter } from "next/navigation";

export default function Home() {

  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Panel de Junta</h1>
      <div className="flex flex-col gap-4 w-full max-w-xs">
      
        <button className="flex items-center justify-center w-full h-24 bg-gray-50 rounded-md text-2xl font-bold text-black"
        onClick={() => {router.push('/rave');}}>
          Tablero de Calificacion
        </button>

          <button className="flex items-center justify-center w-full h-24 bg-gray-50 rounded-md text-2xl font-bold text-black"
            onClick={() => {router.push('/groupGeneration');}}>
            Generar Grupos
          </button>
       
      
      </div>
    </div>
  );
}
