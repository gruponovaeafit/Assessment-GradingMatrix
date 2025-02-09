'use client';

import React, { useEffect, useState } from 'react';
import enviarCalificacion from '../Hooks/test';
import { useStoredId } from "../Hooks/UseStoreId";

const GraderPage: React.FC = () => {
    const { storedId } = useStoredId(); // Obtiene el ID del hook
    const [usuarios, setUsuarios] = useState<{ ID_Base: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedId = localStorage.getItem('storedId');
        if (!storedId) {
            console.error("❌ No se encontró storedId en localStorage.");
            setLoading(false);
            return;
        }

        console.log("📌 ID del grupo obtenido:", storedId);

        async function fetchUsuarios() {
            try {
                const response = await fetch('/api/groupsId', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idGrupo: storedId }),
                });

                if (!response.ok) throw new Error("Error en la API");

                const data = await response.json();
                console.log("✅ Usuarios recibidos:", data);
                setUsuarios(data);
            } catch (error) {
                console.error("❌ Error obteniendo usuarios:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchUsuarios();
    }, [storedId]);
          

    if (loading) return <p className="text-white">Cargando...</p>;
    //if (!id) return <p className="text-white">Error: No se encontró ID de grupo.</p>;
    if (usuarios.length === 0) return <p className="text-white">No hay usuarios para calificar</p>;

return (
        <div className='flex flex-col items-center gap-4'>
            <h1 className='text-4xl font-regular mt-12 mb-8'>Escoge la base que vas a calificar</h1>
    
            <div className='flex flex-col gap-6 w-full max-w-md'>
                {usuarios.map((usuario) => (
                    <div key={usuario.ID_Base} className='bg-gray-300 bg-opacity-10 shadow-md rounded-lg p-6 flex flex-col gap-4'>
                        {/* Nombre del usuario */}
                        <h2 className='text-xl font-semibold text-center'>{usuario.Nombre}</h2>
    
                        {/* Campo para ingresar la calificación */}
                        <input 
                            type="number" 
                            className="w-full p-2 border rounded-md bg-gray-700 text-white"
                            placeholder="Ingrese la calificación"
                        />
    
                        {/* Botón para enviar la calificación */}
                        <button
                            className='rounded-md bg-blue-500 hover:bg-blue-600 text-white text-lg p-3 font-semibold w-full'
                        >
                            Enviar Calificación
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
    
}
export default GraderPage;
