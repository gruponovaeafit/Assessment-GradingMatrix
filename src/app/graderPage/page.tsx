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

    // SOLO PERMITE ENTEROS ENTRE 1 Y 5
    const handleInputChange = (idPersona: number, calificacionNumber: number, value: string) => {
        // Quitar decimales, permite solo enteros
        let numericValue = value.replace(',', '.');
        let number = numericValue === '' ? '' : Number(numericValue);

        if (
            number !== '' &&
            (typeof number === 'number' && (!Number.isInteger(number) || number < 1 || number > 5))
        ) {
            return; // no actualiza si no es entero entre 1 y 5
        }

        setCalificaciones(prev => ({
            ...prev,
            [idPersona]: {
                ...prev[idPersona],
                [`Calificacion_${calificacionNumber}`]: number
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

    // datos extraídos del localStorage

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

    // payload preparado para envío

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
                // grupo rotado exitosamente
                localStorage.setItem("id_grupo", data.nuevoGrupo);
            }

            alert('✅ Todas las calificaciones fueron enviadas correctamente.');
            setCalificaciones({});
            setErrores([]);
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('❌ Error al enviar calificaciones múltiples:', error);
            alert('Error al enviar las calificaciones. Intenta de nuevo.');
        }
    };


    if (loading) return <p className="text-white text-center mt-20">Cargando...</p>;
    if (usuarios.length === 0) return <p className="text-white text-center mt-20">No hay usuarios para calificar</p>;

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-4 bg-cover bg-center"
            style={{ backgroundImage: "url('/rosamorado.svg')" }}
        >
            {nombreCalificador && (
                <h2 className="text-white text-lg sm:text-xl font-bold mt-4 mb-4 sm:mb-6 text-center">
                    Hola, {nombreCalificador}
                </h2>
            )}

            {baseData && (
                <div className="text-white w-full max-w-xl mb-6 sm:mb-10 px-4 sm:px-6 py-4 sm:py-6 rounded-2xl shadow-lg bg-primary-dark/80 border border-white/30 backdrop-blur-sm">
                    <h2 className='text-xl sm:text-2xl font-extrabold mb-2 text-center tracking-wide'>{baseData.Nombre}</h2>
                    <h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center italic text-white/90'>{baseData.Competencia}</h3>
                    <p className='mb-4 sm:mb-6 text-xs sm:text-sm text-justify text-white/80'>{baseData.Descripcion}</p>
                    <div className='space-y-2 sm:space-y-3 text-xs sm:text-sm'>
                        <div><span className='font-bold text-primary-light'>🟣 Comportamiento 1:</span> {baseData.Comportamiento1}</div>
                        <div><span className='font-bold text-primary-light'>🟣 Comportamiento 2:</span> {baseData.Comportamiento2}</div>
                        <div><span className='font-bold text-primary-light'>🟣 Comportamiento 3:</span> {baseData.Comportamiento3}</div>
                    </div>
                </div>
            )}

            <div className='flex flex-col items-center gap-6 sm:gap-8 w-full'>
                {usuarios.filter((usuario) => usuario.role !== 'Impostor').map((usuario) => (
                    <div
                        key={usuario.ID}
                        className={`relative text-white px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 rounded-lg bg-cover bg-center flex flex-col items-center mx-auto ${errores.includes(usuario.ID) ? 'border-4 border-yellow-400' : ''}`}
                        style={{
                            backgroundImage: "url('/Frame_general.svg')",
                            width: '100%',
                            maxWidth: '360px',
                            minHeight: '450px',
                            backgroundSize: '100% 100%',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center center',
                        }}
                    >
                        <div className="absolute w-full flex justify-center mt-2 sm:mt-3">
                            {usuario.Photo && (
                                <img
                                    src={usuario.Photo}
                                    alt={`Foto de ${usuario.Nombre}`}
                                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-md object-cover shadow-lg border-4 border-white"
                                />
                            )}
                        </div>

                        <div className='mt-32 sm:mt-40'></div>
                        <p className='text-xs sm:text-sm mb-1 font-bold'>ID: {usuario.ID}</p>
                        <p className='text-xs sm:text-sm mb-3 sm:mb-4 font-bold text-center'>Nombre: {usuario.Nombre}</p>

                        {[1, 2, 3].map(num => (
                            <div key={num} className='mb-2 w-32 sm:w-36 px-2 sm:px-4'>
                                <label className='text-xs sm:text-sm font-semibold block mb-1'>Habilidad #{num}:</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="1"
                                    max="5"
                                    value={calificaciones[usuario.ID]?.[`Calificacion_${num}` as CalificacionKey] ?? ''}
                                    onChange={e => handleInputChange(usuario.ID, num, e.target.value)}
                                    placeholder="1-5"
                                    className='w-full px-2 sm:px-3 py-2 rounded bg-primary text-white placeholder-white/70 font-medium text-center shadow-md focus:outline-none focus:ring-2 focus:ring-white/70 text-sm'
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <button
                onClick={handleSubmitGeneral}
                className="mt-6 sm:mt-10 px-4 sm:px-6 py-2 sm:py-3 bg-primary-dark text-white font-semibold rounded-lg shadow-md hover:bg-primary transition text-sm sm:text-base"
            >
                Enviar todas las calificaciones
            </button>

            <p className='text-white text-xs italic mt-6 sm:mt-10'>POWERED BY <span className='font-bold text-primary-light'>NOVA</span></p>
        </div>
    );
};

export default GraderPage;
