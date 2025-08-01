'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useStoredId } from "../Hooks/UseStoreId";

const GraderPage: React.FC = () => {
    const { storedData } = useStoredId();
    const [usuarios, setUsuarios] = useState<{
        ID: number; Nombre: ReactNode; ID_Persona: number; role: string;
    }[]>([]);
    const [loading, setLoading] = useState(true);
    const [calificaciones, setCalificaciones] = useState<{
        [key: number]: {
            Calificacion_1: number | '';
            Calificacion_2: number | '';
            Calificacion_3: number | '';
        };
    }>({});

    useEffect(() => {
        const storedData = localStorage.getItem("storedData");
        const parsedData = storedData ? JSON.parse(storedData) : null;
        const storedId = parsedData?.idGrupo;

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
                //console.log("✅ Usuarios recibidos:", data);
                setUsuarios(data);
            } catch (error) {
                console.error("❌ Error obteniendo usuarios:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchUsuarios();
    }, [storedData]);

    const handleInputChange = (idPersona: number, calificacionNumber: number, value: string) => {
        setCalificaciones(prev => ({
            ...prev,
            [idPersona]: {
                ...prev[idPersona],
                [`Calificacion_${calificacionNumber}`]: value ? Number(value) : ''
            }
        }));
    };

    const handleSubmit = async (idPersona: number) => {
        const storedData = localStorage.getItem("storedData");
        const parsedData = storedData ? JSON.parse(storedData) : null;
        const id_grupo = parsedData?.idGrupo;
        const id_calificador = parsedData?.id_Calificador;
        const id_base = parsedData?.id_base;

        const { Calificacion_1, Calificacion_2, Calificacion_3 } = calificaciones[idPersona];

        try {
            const response = await fetch('/api/add-calificacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ID_Persona: idPersona,
                    ID_Grupo: id_grupo,
                    ID_Base: id_base,
                    ID_Calificador: id_calificador,
                    Calificacion_1,
                    Calificacion_2,
                    Calificacion_3,
                }),
            });

            if (!response.ok) throw new Error('Error al enviar las calificaciones');

            const data = await response.json();
            console.log('✅ Calificaciones guardadas:', data);
            alert('Calificaciones guardadas correctamente');
            setCalificaciones((prev) => ({ ...prev, [idPersona]: { Calificacion_1: '', Calificacion_2: '', Calificacion_3: '' } })); // Resetear el campo después de enviar
        } catch (error) {
            console.error('❌ Error:', error);
            alert('Error al guardar las calificaciones');
        }
    };

    if (loading) return <p className="text-white">Cargando...</p>;
    if (usuarios.length === 0) return <p className="text-white">No hay usuarios para calificar</p>;

    return (
        <div className='flex flex-col items-center gap-4'>
            <h1 className='text-4xl font-regular mt-12 mb-8'>Escoge la persona que vas a calificar</h1>

            <div className='flex flex-col gap-6 w-full max-w-md'>
                {usuarios.filter((usuario) => usuario.role !== 'Impostor').map((usuario) => (
                    <div key={usuario.ID} className='bg-gray-300 bg-opacity-10 shadow-md rounded-lg p-6 flex flex-col gap-4'>
                        <h2 className='text-xl font-semibold text-center'>{usuario.Nombre}</h2>

                        {/* Input para Calificación 1 */}
                        <input
                            type="number"
                            value={calificaciones[usuario.ID]?.Calificacion_1 || ''}
                            onChange={(e) => handleInputChange(usuario.ID, 1, e.target.value)}
                            className="w-full p-2 border rounded-md bg-gray-700 text-white"
                            placeholder="Ingrese la calificación 1"
                        />

                        {/* Input para Calificación 2 */}
                        <input
                            type="number"
                            value={calificaciones[usuario.ID]?.Calificacion_2 || ''}
                            onChange={(e) => handleInputChange(usuario.ID, 2, e.target.value)}
                            className="w-full p-2 border rounded-md bg-gray-700 text-white"
                            placeholder="Ingrese la calificación 2"
                        />

                        {/* Input para Calificación 3 */}
                        <input
                            type="number"
                            value={calificaciones[usuario.ID]?.Calificacion_3 || ''}
                            onChange={(e) => handleInputChange(usuario.ID, 3, e.target.value)}
                            className="w-full p-2 border rounded-md bg-gray-700 text-white"
                            placeholder="Ingrese la calificación 3"
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
