'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useStoredId } from "../Hooks/UseStoreId";

const GraderPage: React.FC = () => {
    const { storedData } = useStoredId();
    const [usuarios, setUsuarios] = useState<{
        ID: number; Nombre: ReactNode; ID_Persona: number 
}[]>([]);
    const [loading, setLoading] = useState(true);
    const [calificaciones, setCalificaciones] = useState<{ [key: number]: number | '' }>({});

    useEffect(() => {
        const storedData = localStorage.getItem("storedData");
        const parsedData = storedData ? JSON.parse(storedData) : null;
        const storedId = parsedData?.id_base;

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
    }, [storedData]);

    const handleInputChange = (idPersona: number, value: string) => {
        setCalificaciones((prev) => ({
            ...prev,
            [idPersona]: value ? Number(value) : '', // Convertir a número o dejar vacío
        }));
    };

    const handleSubmit = async (idPersona: number) => {
        const storedData = localStorage.getItem("storedData");
        const parsedData = storedData ? JSON.parse(storedData) : null;
        const id_grupo = parsedData?.idGrupo;
        const id_calificador = parsedData?.id_Calificador;
        const id_base = parsedData?.id_base;

        const calificacion = calificaciones[idPersona];

        try {
            const response = await fetch('/api/add-calificacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ID_Persona: idPersona,
                    ID_Grupo: id_grupo,
                    ID_Base: id_base,
                    ID_Calificador: id_calificador,
                    Calificacion: calificacion,
                }),
            });

            if (!response.ok) throw new Error('Error al enviar la calificación');

            const data = await response.json();
            console.log('✅ Calificación guardada:', data);
            alert('Calificación guardada correctamente');
            setCalificaciones((prev) => ({ ...prev, [idPersona]: '' })); // Resetear el campo después de enviar
        } catch (error) {
            console.error('❌ Error:', error);
            alert('Error al guardar la calificación');
        }
    };

    if (loading) return <p className="text-white">Cargando...</p>;
    if (usuarios.length === 0) return <p className="text-white">No hay usuarios para calificar</p>;

    return (
        <div className='flex flex-col items-center gap-4'>
            <h1 className='text-4xl font-regular mt-12 mb-8'>Escoge la persona que vas a calificar</h1>
    
            <div className='flex flex-col gap-6 w-full max-w-md'>
                {usuarios.map((usuario) => (
                    <div key={usuario.ID} className='bg-gray-300 bg-opacity-10 shadow-md rounded-lg p-6 flex flex-col gap-4'>
                        <h2 className='text-xl font-semibold text-center'>{usuario.Nombre}</h2>
    
                        <input
                            type="number"
                            value={calificaciones[usuario.ID] || ''} 
                            onChange={(e) => handleInputChange(usuario.ID, e.target.value)}
                            className="w-full p-2 border rounded-md bg-gray-700 text-white"
                            placeholder="Ingrese la calificación"
                        />
    
                        <button
                            className='rounded-md bg-blue-500 hover:bg-blue-600 text-white text-lg p-3 font-semibold w-full'
                            onClick={() => handleSubmit(usuario.ID)}
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
