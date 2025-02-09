'use client';

import React, { useEffect, useState } from 'react';
import enviarCalificacion from '../Hooks/test';
import { useStoredId } from "../Hooks/UseStoreId";

const GraderPage: React.FC = () => {
    const [usuarios, setUsuarios] = useState<{ ID_Base: number }[]>([]);
    const [loading, setLoading] = useState(true);



        const id = localStorage.getItem("storedId"); 


    useEffect(() => {
        if (!id) return;

        console.log("📌 ID del grupo obtenido:", id);

        async function fetchUsuarios() {
            try {
                const response = await fetch(`/api/groupsId`, { method: 'OPTIONS', body: JSON.stringify({ id }) }); 
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
    }, [id]);

    if (loading) return <p className="text-white">Cargando...</p>;
    if (!id) return <p className="text-white">Error: No se encontró ID de grupo.</p>;
    if (usuarios.length === 0) return <p className="text-white">No hay usuarios para calificar</p>;

    return (
        <div className='flex flex-col items-center gap-4'>
            <h1 className='text-4xl font-regular mt-[50] mb-[20]'>Escoge la base que vas a calificar</h1>
              
            <div className='flex justify-center items-center gap-4'>
                {usuarios.map((usuario) => (
                    <div key={usuario.ID_Base} className='bg-gray-300 bg-opacity-10 shadow-md rounded-lg p-6'>
                        <h2 className='text-2xl font-semibold mb-4'>Base {usuario.ID_Base}</h2>
                        <button
                            className='rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-semibold w-full'
                        >
                            {`Ingresar a Base ${usuario.ID_Base}`}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GraderPage;
