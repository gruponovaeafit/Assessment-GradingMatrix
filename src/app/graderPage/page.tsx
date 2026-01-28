'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useStoredId } from "../Hooks/UseStoreId";
import { useAdminAuth } from "../Hooks/useAdminAuth";
import { Spinner, SkeletonBaseInfo, SkeletonUserCard } from '../components/UI/Loading';
import { showToast } from '../components/UI/Toast';
import { useConfirmModal } from '../components/UI/ConfirmModal';

const GraderPage: React.FC = () => {
    const { storedData } = useStoredId();
    const { isAdmin, isLoading: authLoading, requireAdmin } = useAdminAuth();
        // Proteger la ruta - redirige si no es admin
        React.useEffect(() => {
            requireAdmin();
        }, [isAdmin, authLoading]);
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
    const [submitting, setSubmitting] = useState(false);
    const { confirm, setIsLoading, ConfirmModalComponent } = useConfirmModal();

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
            showToast.error('Todos los participantes deben tener las 3 calificaciones asignadas');
            return;
        }

        // Mostrar modal de confirmación
        const confirmed = await confirm({
            title: 'Confirmar envío',
            message: `¿Estás seguro de enviar las calificaciones para ${usuarios.filter(u => u.role !== 'Impostor').length} participantes? Esta acción no se puede deshacer.`,
            confirmText: 'Sí, enviar',
            cancelText: 'Cancelar',
            variant: 'warning',
        });

        if (!confirmed) return;

        setSubmitting(true);
        setIsLoading(true);
        const storedData = localStorage.getItem("storedData");
        const parsedData = storedData ? JSON.parse(storedData) : null;
        const id_calificador = parsedData?.id_Calificador;
        const id_base = parsedData?.id_base;

    // datos extraídos del localStorage

        if (!id_calificador || !id_base) {
            showToast.error('Faltan datos esenciales (calificador o base)');
            setSubmitting(false);
            setIsLoading(false);
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

            showToast.success('¡Calificaciones enviadas correctamente!');
            setCalificaciones({});
            setErrores([]);
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (error) {
            console.error('❌ Error al enviar calificaciones múltiples:', error);
            showToast.error('Error al enviar las calificaciones. Intenta de nuevo.');
        } finally {
            setSubmitting(false);
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div
                className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-4 bg-white"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Spinner size="lg" color="primary-light" />
                    <span className="text-gray-500 text-xl font-medium">Cargando datos...</span>
                </div>
                <SkeletonBaseInfo />
                <div className="flex flex-col items-center gap-6 sm:gap-8 w-full mt-6">
                    {[1, 2].map((i) => (
                        <SkeletonUserCard key={i} />
                    ))}
                </div>
            </div>
        );
    }
    
    if (usuarios.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-4 bg-white"
            >
                <div className="text-center text-gray-900">
                    <p className="text-xl mb-4">No hay usuarios para calificar</p>
                    <p className="text-sm text-gray-500">Contacta al administrador si esto es un error.</p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-4 bg-[color:var(--color-bg)]"
        >
            {nombreCalificador && (
                <h2 className="text-[color:var(--color-accent)] text-lg sm:text-xl font-bold mt-4 mb-4 sm:mb-6 text-center">
                    Hola, {nombreCalificador}
                </h2>
            )}

            {baseData && (
                <div className="w-full max-w-xl mb-6 sm:mb-10 px-4 sm:px-6 py-4 sm:py-6 rounded-2xl shadow-lg bg-[color:var(--color-surface)] border border-[color:var(--color-muted)]">
                    <h2 className='text-xl sm:text-2xl font-extrabold mb-2 text-center tracking-wide text-[color:var(--color-accent)]'>{baseData.Nombre}</h2>
                    <h3 className='text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-center italic text-[color:var(--color-text)]/90'>{baseData.Competencia}</h3>
                    <p className='mb-4 sm:mb-6 text-xs sm:text-sm text-justify text-[color:var(--color-muted)]'>{baseData.Descripcion}</p>
                    <div className='space-y-2 sm:space-y-3 text-xs sm:text-sm'>
                        <div><span className='font-bold text-[color:var(--color-accent)]'>🟣 Comportamiento 1:</span> {baseData.Comportamiento1}</div>
                        <div><span className='font-bold text-[color:var(--color-accent)]'>🟣 Comportamiento 2:</span> {baseData.Comportamiento2}</div>
                        <div><span className='font-bold text-[color:var(--color-accent)]'>🟣 Comportamiento 3:</span> {baseData.Comportamiento3}</div>
                    </div>
                </div>
            )}

            <div className='flex flex-col items-center gap-6 sm:gap-8 w-full'>
                {usuarios.filter((usuario) => usuario.role !== 'Impostor').map((usuario) => (
                    <div
                        key={usuario.ID}
                        className={`relative text-white px-4 sm:px-6 pt-4 sm:pt-6 pb-4 sm:pb-6 rounded-lg bg-cover bg-center flex flex-col items-center mx-auto ${errores.includes(usuario.ID) ? 'border-4 border-yellow-400' : ''}`}
                        style={{
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

                        {[1, 2, 3].map(num => {
                            const comportamiento = baseData?.[`Comportamiento${num}` as keyof typeof baseData] as string;
                            return (
                                <div key={num} className='mb-3 w-full max-w-xs px-2 sm:px-4'>
                                    <p className='text-xs text-white/80 italic mb-1 text-center'>{comportamiento}</p>
                                    <label className='text-xs sm:text-sm font-semibold block mb-1 text-center'>Comportamiento #{num}:</label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={5}
                                        step={1}
                                        className="w-full rounded-lg px-3 py-2 text-black text-center font-bold text-lg bg-white border-2 border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                                        value={calificaciones[usuario.ID]?.[`Calificacion_${num}` as keyof typeof calificaciones[typeof usuario.ID]] ?? ''}
                                        onChange={e => handleInputChange(usuario.ID, num, e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="w-full flex flex-col items-center mt-8">
                <button
                    onClick={handleSubmitGeneral}
                    disabled={submitting}
                    className="bg-[color:var(--color-accent)] text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-[#5B21B6] transition disabled:opacity-60"
                >
                    {submitting ? 'Enviando...' : 'Enviar calificaciones'}
                </button>
            </div>

            <ConfirmModalComponent />
        </div>
        );
    }

    export default GraderPage;
