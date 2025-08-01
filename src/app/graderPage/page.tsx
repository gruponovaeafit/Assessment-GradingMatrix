'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useStoredId } from "../Hooks/UseStoreId";

const GraderPage: React.FC = () => {
    const { storedData } = useStoredId();
    const [usuarios, setUsuarios] = useState<{
        ID: number; Nombre: ReactNode; ID_Persona: number; Grupo: string; role: string; Photo?: string;
    }[]>([]);
    const [loading, setLoading] = useState(true);
    const [baseData, setBaseData] = useState<{
        Nombre: string;
        Competencia: string;
        Descripcion: string;
        Comportamiento1: string;
        Comportamiento2: string;
        Comportamiento3: string;
        id_Calificador?: number;
    } | null>(null);
    const [nombreCalificador, setNombreCalificador] = useState<string | null>(null);

    type CalificacionKey = 'Calificacion_1' | 'Calificacion_2' | 'Calificacion_3';
    type CalificacionesType = {
        [key: number]: {
            [K in CalificacionKey]: number | '';
        };
    };

    const [calificaciones, setCalificaciones] = useState<CalificacionesType>({});
    const [errores, setErrores] = useState<number[]>([]);

    useEffect(() => {
        const storedData = localStorage.getItem("storedData");
        const parsedData = storedData ? JSON.parse(storedData) : null;
        const idBase = parsedData?.id_base;
        const id_Calificador = parsedData?.id_Calificador;

        if (!idBase || !id_Calificador) {
            console.error("❌ No se encontró id_base o id_Calificador en localStorage.");
            setLoading(false);
            return;
        }

        async function fetchUsuarios() {
            try {
                const response = await fetch('/api/groupsId', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idCalificador: id_Calificador }),
                });
                if (!response.ok) throw new Error("Error en la API de usuarios");
                const data = await response.json();
                setUsuarios(data);
            } catch (error) {
                console.error("❌ Error obteniendo usuarios:", error);
            } finally {
                setLoading(false);
            }
        }

        async function fetchBaseData() {
            try {
                const response = await fetch('/api/getBaseData', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_base: idBase }),
                });
                if (!response.ok) throw new Error("Error en la API de base");
                const data = await response.json();
                setBaseData(data);
            } catch (error) {
                console.error("❌ Error obteniendo base:", error);
            }
        }

        async function fetchNombreCalificador() {
            try {
                const response = await fetch('/api/getCalificador', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id_calificador: id_Calificador }),
                });
                if (!response.ok) throw new Error('Error al obtener calificador');
                const data = await response.json();
                setNombreCalificador(data.Correo);
            } catch (error) {
                console.error("❌ Error obteniendo nombre del calificador:", error);
            }
        }

        fetchUsuarios();
        fetchBaseData();
        fetchNombreCalificador();
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

    const validarTodasLasCalificaciones = () => {
        const erroresLocales: number[] = [];
        for (const usuario of usuarios) {
            const cal = calificaciones[usuario.ID];
            if (!cal || cal.Calificacion_1 === '' || cal.Calificacion_2 === '' || cal.Calificacion_3 === '') {
                erroresLocales.push(usuario.ID);
            }
        }
        setErrores(erroresLocales);
        return erroresLocales.length === 0;
    };

    const handleSubmitGeneral = async () => {
        if (!validarTodasLasCalificaciones()) {
            alert('⚠️ Todos los participantes deben tener las 3 calificaciones asignadas antes de enviar.');
            return;
        }

        const storedData = localStorage.getItem("storedData");
        const parsedData = storedData ? JSON.parse(storedData) : null;
        const id_calificador = parsedData?.id_Calificador;
        const id_base = parsedData?.id_base;

        console.log("🧠 Datos del localStorage:", { id_calificador, id_base });

        if (!id_calificador || !id_base) {
            alert("❌ Faltan datos esenciales (calificador o base)");
            return;
        }

        const payload = usuarios
            .filter((usuario) => usuario.role !== 'Impostor')
            .map((usuario) => {
                const cal = calificaciones[usuario.ID];
                return {
                    ID_Persona: usuario.ID_Persona,
                    ID_Base: id_base,
                    ID_Calificador: id_calificador,
                    Calificacion_1: cal?.Calificacion_1,
                    Calificacion_2: cal?.Calificacion_2,
                    Calificacion_3: cal?.Calificacion_3,
                };
            });

        console.log("📦 Payload a enviar:", payload);

        try {
            const response = await fetch('/api/add-calificaciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                const errorText = await response.text();
                console.error("🛑 Error en respuesta:", errorText);
                throw new Error('Error al enviar las calificaciones');
            }

            if (data.nuevoGrupo) {
                console.log("🌀 Grupo rotado a:", data.nuevoGrupo);
                localStorage.setItem("id_grupo", data.nuevoGrupo);
            }

            alert('✅ Todas las calificaciones fueron enviadas correctamente.');
            setCalificaciones({});
            setErrores([]);
            setTimeout(() => {
                window.location.reload();
            }, 5000);

        } catch (error) {
            console.error('❌ Error al enviar calificaciones múltiples:', error);
            alert('Error al enviar las calificaciones. Intenta de nuevo.');
        }
    };


    if (loading) return <p className="text-white">Cargando...</p>;
    if (usuarios.length === 0) return <p className="text-white">No hay usuarios para calificar</p>;

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen py-2 bg-cover bg-center"
            style={{ backgroundImage: "url('/rosamorado.svg')" }}
        >
            {nombreCalificador && (
                <h2 className="text-white text-xl font-bold mt-4 mb-6">
                    Hola, {nombreCalificador}
                </h2>
            )}

            {baseData && (
                <div className="text-white max-w-xl mb-10 px-6 py-6 rounded-2xl shadow-lg bg-gradient-to-br from-pink-700/70 to-purple-800/60 border border-white/30 backdrop-blur-sm">
                    <h2 className='text-2xl font-extrabold mb-2 text-center tracking-wide'>{baseData.Nombre}</h2>
                    <h3 className='text-lg font-semibold mb-4 text-center italic text-white/90'>{baseData.Competencia}</h3>
                    <p className='mb-6 text-sm text-justify text-white/80'>{baseData.Descripcion}</p>
                    <div className='space-y-3 text-sm'>
                        <div><span className='font-bold text-white'>🟣 Comportamiento 1:</span> {baseData.Comportamiento1}</div>
                        <div><span className='font-bold text-white'>🟣 Comportamiento 2:</span> {baseData.Comportamiento2}</div>
                        <div><span className='font-bold text-white'>🟣 Comportamiento 3:</span> {baseData.Comportamiento3}</div>
                    </div>
                </div>
            )}

            <div className='flex flex-col items-center gap-8 w-full'>
                {usuarios.filter((usuario) => usuario.role !== 'Impostor').map((usuario) => (
                    <div
                        key={usuario.ID}
                        className={`relative text-white px-6 pt-6 pb-6 rounded-lg bg-cover bg-center flex flex-col items-center mx-auto ${errores.includes(usuario.ID) ? 'border-4 border-yellow-400' : ''}`}
                        style={{
                            backgroundImage: "url('/Frame_general.svg')",
                            width: '100%',
                            maxWidth: '400px',
                            height: '500px',
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center center',
                        }}
                    >
                        <div className="absolute w-full flex justify-center mt-3">
                            {usuario.Photo && (
                                <img
                                    src={usuario.Photo}
                                    alt={`Foto de ${usuario.Nombre}`}
                                    className="w-36 h-36 rounded-md object-cover shadow-lg border-4 border-white"
                                />
                            )}
                        </div>

                        <div className='mt-40'></div>
                        <p className='text-sm mb-1 font-bold'>ID: {usuario.ID}</p>
                        <p className='text-sm mb-4 font-bold'>Nombre: {usuario.Nombre}</p>

                        {[1, 2, 3].map(num => (
                            <div key={num} className='mb-2 w-36 px-4'>
                                <label className='text-sm font-semibold block mb-1'>Habilidad #{num}:</label>
                                <input
                                    value={calificaciones[usuario.ID]?.[`Calificacion_${num}` as CalificacionKey] || ''}
                                    onChange={(e) => handleInputChange(usuario.ID, num, e.target.value)}
                                    placeholder="Calificación"
                                    className='w-full px-3 py-2 rounded bg-pink-600 text-white placeholder-white font-medium text-center shadow-md focus:outline-none focus:ring-2 focus:ring-white/70'
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <button
                onClick={handleSubmitGeneral}
                className="mt-10 px-6 py-3 bg-[#BD00FF] text-white font-semibold rounded-lg shadow-md hover:bg-[#9d00d3] transition"
            >
                Enviar todas las calificaciones
            </button>

            <p className='text-white text-xs italic mt-10'>POWERED BY <span className='font-bold text-[#BD00FF]'>NOVA</span></p>
        </div>
    );
};

export default GraderPage;
