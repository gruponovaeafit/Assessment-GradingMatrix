'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { useStoredId } from "../Hooks/UseStoreId";
import { useGraderAuth } from "../Hooks/useGraderAuth";
import { Spinner, SkeletonBaseInfo, SkeletonUserCard } from '../components/UI/Loading';
import { showToast } from '../components/UI/Toast';
import { useConfirmModal } from '../components/UI/ConfirmModal';

const GraderPage: React.FC = () => {
    //Estado para ver si ya calificó
    const [alreadyGraded, setAlreadyGraded] = useState(false);
    const [checkingStatus, setCheckingStatus] = useState(true);

    const { storedData } = useStoredId();
    const { isGrader, isLoading: authLoading, requireGrader } = useGraderAuth();
    React.useEffect(() => {
        requireGrader();
    }, [isGrader, authLoading]);
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

    const getInitials = (name: ReactNode) => {
        if (typeof name !== 'string') return 'NA';
        const parts = name.trim().split(/\s+/).filter(Boolean);
        const initials = parts.slice(0, 2).map((part) => part[0]).join('');
        return initials ? initials.toUpperCase() : 'NA';
    };

    useEffect(() => {
        const storedData = localStorage.getItem("storedData");
        const parsedData = storedData ? JSON.parse(storedData) : null;
        const idBase = parsedData?.id_base;
        const id_Calificador = parsedData?.id_Calificador;
        const authToken = localStorage.getItem("authToken");
        const authHeaders: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        const jsonHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            ...authHeaders,
        };

        if (!idBase || !id_Calificador) {
            console.error("❌ No se encontró id_base o id_Calificador en localStorage.");
            setLoading(false);
            return;
        }

        async function fetchUsuarios() {
            try {
                const response = await fetch('/api/groupsId', {
                    method: 'POST',
                    headers: jsonHeaders,
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
                    headers: jsonHeaders,
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
                    headers: jsonHeaders,
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

    // Verificar si ya calificó a este grupo al cargar la página
    useEffect(() => {
        const checkIfAlreadyGraded = async () => {
            const storedData = localStorage.getItem("storedData");
            const parsedData = storedData ? JSON.parse(storedData) : null;
            const id_calificador = parsedData?.id_Calificador;
            const id_base = parsedData?.id_base;

            // ✅ IMPORTANTE: Verificar que tengamos los datos necesarios
            if (!id_calificador || !id_base) {
                console.log("⚠️ Faltan datos para verificar:", { id_calificador, id_base });
                setCheckingStatus(false);
                return;
            }

            console.log("🔍 Verificando si ya calificó:", { id_calificador, id_base });

            try {
                const authToken = localStorage.getItem("authToken");
                const authHeaders: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};
                const jsonHeaders: HeadersInit = {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                };

                const response = await fetch('/api/check-already-graded', {
                    method: 'POST',
                    headers: jsonHeaders,
                    body: JSON.stringify({
                        idCalificador: id_calificador,
                        idBase: id_base,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log("✅ Resultado verificación:", data);
                    setAlreadyGraded(data.alreadyGraded);
                    
                    if (data.alreadyGraded) {
                        showToast.error('Ya has calificado a este grupo anteriormente');
                    }
                } else {
                    const errorData = await response.json();
                    console.error("❌ Error en verificación:", errorData);
                }
            } catch (error) {
                console.error('❌ Error verificando estado de calificación:', error);
            } finally {
                setCheckingStatus(false);
            }
        };

        checkIfAlreadyGraded();
    }, [storedData]); // ✅ CAMBIO: Agregar storedData como dependencia


    // Cargar calificaciones existentes si ya calificó
    useEffect(() => {
        const loadExistingGrades = async () => {
            if (!alreadyGraded || usuarios.length === 0) return;

            const storedData = localStorage.getItem("storedData");
            const parsedData = storedData ? JSON.parse(storedData) : null;
            const id_calificador = parsedData?.id_Calificador;
            const id_base = parsedData?.id_base;

            if (!id_calificador || !id_base) return;

            try {
                const authToken = localStorage.getItem("authToken");
                const authHeaders: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};
                const jsonHeaders: HeadersInit = {
                    'Content-Type': 'application/json',
                    ...authHeaders,
                };

                console.log('🔍 Cargando calificaciones existentes...'); // Debug

                const response = await fetch('/api/get-calificaciones-by-calificador', {
                    method: 'POST',
                    headers: jsonHeaders,
                    body: JSON.stringify({
                        idCalificador: id_calificador,
                        idBase: id_base,
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('📥 Datos recibidos:', data); // Debug
                    
                    // Mapear las calificaciones al formato del estado
                    const calificacionesMap: CalificacionesType = {};
                    
                    data.calificaciones.forEach((cal: any) => {
                        console.log('🔄 Procesando calificación:', cal); // Debug
                        
                        // ⚠️ CLAVE: Buscar el usuario por ID_Persona, NO por ID
                        const usuario = usuarios.find(u => u.ID_Persona === cal.ID_Participante);
                        
                        console.log('👤 Usuario encontrado:', usuario); // Debug
                        
                        if (usuario) {
                            // Usar usuario.ID como clave (que es lo que usa el componente)
                            calificacionesMap[usuario.ID] = {
                                Calificacion_1: cal.Calificacion_1,
                                Calificacion_2: cal.Calificacion_2,
                                Calificacion_3: cal.Calificacion_3,
                            };
                        } else {
                            console.warn('⚠️ No se encontró usuario para ID_Participante:', cal.ID_Participante);
                        }
                    });
                    
                    console.log('✅ Calificaciones mapeadas:', calificacionesMap); // Debug
                    setCalificaciones(calificacionesMap);
                } else {
                    console.error('❌ Error en respuesta:', response.status);
                }
            } catch (error) {
                console.error('❌ Error cargando calificaciones existentes:', error);
            }
        };

        if (alreadyGraded && usuarios.length > 0) {
            loadExistingGrades();
        }
    }, [alreadyGraded, usuarios]);




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

        // Verificación adicional antes de enviar
        if (alreadyGraded) {
            showToast.error('Ya has calificado a este grupo anteriormente. No puedes volver a calificar.');
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

        try {
            const authToken = localStorage.getItem("authToken");
            const authHeaders: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};
            const jsonHeaders: HeadersInit = {
                'Content-Type': 'application/json',
                ...authHeaders,
            };

            const response = await fetch('/api/add-calificaciones', {
                method: 'POST',
                headers: jsonHeaders,
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            // ✅ NUEVO: Manejar error específico de ya calificado
            if (!response.ok) {
                if (data.code === 'ALREADY_GRADED') {
                    showToast.error('Ya has calificado a este grupo anteriormente. No puedes volver a calificar.');
                    setAlreadyGraded(true); // Marcar como ya calificado
                    setSubmitting(false);
                    setIsLoading(false);
                    return;
                }
                throw new Error(data.error || 'Error al enviar las calificaciones');
            }

            if (data.nuevoGrupo) {
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
            className="flex flex-col items-center justify-center min-h-screen py-6 sm:py-10 px-4 bg-white"
        >
            <div className="w-full max-w-6xl">
                {nombreCalificador && (
                    <h2 className="text-[color:var(--color-accent)] text-lg sm:text-xl font-bold mt-2 mb-4 sm:mb-6 text-center">
                        Hola, {nombreCalificador}
                    </h2>
                )}

                {/* Mostrar banner si ya calificó */}
                {alreadyGraded && (
                    <div className="w-full max-w-3xl mx-auto mb-6 px-5 py-4 rounded-lg bg-yellow-50 border-2 border-yellow-400">
                        <p className="text-center text-yellow-800 font-semibold">
                            ⚠️ Ya has calificado a este grupo anteriormente. No puedes volver a calificar.
                        </p>
                    </div>
                )}

                <div className="w-full max-w-3xl mx-auto mb-6 sm:mb-10 px-5 sm:px-6 py-5 sm:py-6 rounded-2xl shadow-lg bg-white border border-gray-100">
                    {baseData ? (
                        <>
                            <h2 className='text-xl sm:text-2xl font-extrabold mb-2 text-center tracking-wide text-[color:var(--color-accent)]'>{baseData.Nombre}</h2>
                            <div className="text-sm sm:text-base text-gray-800 mb-3 sm:mb-4 text-center font-semibold">
                                Competencia: <span className="font-normal italic">{baseData.Competencia}</span>
                            </div>
                            <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500">
                                <span className="font-semibold text-gray-700">Descripcion:</span> {baseData.Descripcion}
                            </div>
                            <div className='space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-700'>
                                <div><span className='font-bold text-[color:var(--color-accent)]'>🟣 Comportamiento 1:</span> {baseData.Comportamiento1}</div>
                                <div><span className='font-bold text-[color:var(--color-accent)]'>🟣 Comportamiento 2:</span> {baseData.Comportamiento2}</div>
                                <div><span className='font-bold text-[color:var(--color-accent)]'>🟣 Comportamiento 3:</span> {baseData.Comportamiento3}</div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-gray-500 text-sm sm:text-base">
                            No se pudieron cargar los datos de la base.
                        </div>
                    )}
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 w-full'>
                    {usuarios.filter((usuario) => usuario.role !== 'Impostor').map((usuario) => {
                        const photoUrl = typeof usuario.Photo === 'string' ? usuario.Photo.trim() : '';
                        return (
                            <div
                                key={usuario.ID}
                                className={`relative px-4 sm:px-5 pt-5 sm:pt-6 pb-5 sm:pb-6 rounded-2xl bg-white border-2 shadow-lg ${errores.includes(usuario.ID) ? 'border-yellow-400 ring-2 ring-yellow-300' : 'border-gray-300'}`}
                            >
                                <div className="flex flex-col items-center gap-3 mb-4">
                                    <div className="w-40 h-40 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-300 shadow flex items-center justify-center">
                                        {photoUrl ? (
                                            <img
                                                src={photoUrl}
                                                alt={`Foto de ${usuario.Nombre}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Si la imagen falla al cargar, ocultar el img y mostrar iniciales
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    // Mostrar las iniciales en el contenedor padre
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.innerHTML = `<span class="text-lg sm:text-xl font-bold text-[color:var(--color-accent)]">${getInitials(usuario.Nombre)}</span>`;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span className="text-lg sm:text-xl font-bold text-[color:var(--color-accent)]">
                                                {getInitials(usuario.Nombre)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="min-w-0 text-center">
                                        <p className='text-xs text-gray-500'>ID: {usuario.ID}</p>
                                        <p className='text-base sm:text-lg font-bold text-gray-900 truncate'>{usuario.Nombre}</p>
                                        {usuario.Grupo && (
                                            <p className='text-xs text-gray-500'>Grupo: {usuario.Grupo}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {[1, 2, 3].map(num => {
                                        const comportamiento = baseData?.[`Comportamiento${num}` as keyof typeof baseData] as string;
                                        return (
                                            <div key={num} className='w-full'>
                                                <p className='text-xs sm:text-sm font-semibold text-center text-[color:var(--color-accent)]'>
                                                    Comportamiento {num}
                                                </p>
                                                <p className='text-xs text-gray-500 italic mb-1 text-center'>{comportamiento}</p>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    max={5}
                                                    step={1}
                                                    className="w-full rounded-lg px-3 py-2 text-gray-900 text-center font-bold text-lg bg-white border-2 border-[color:var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                                                    value={calificaciones[usuario.ID]?.[`Calificacion_${num}` as keyof typeof calificaciones[typeof usuario.ID]] ?? ''}
                                                    onChange={e => handleInputChange(usuario.ID, num, e.target.value)}
                                                    disabled={submitting || alreadyGraded} // ✅ NUEVO: deshabilitar si ya calificó
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="w-full flex flex-col items-center mt-8 sm:mt-10">
                <button
                    onClick={handleSubmitGeneral}
                    disabled={submitting || alreadyGraded} // ✅ NUEVO: deshabilitar si ya calificó
                    className="bg-[color:var(--color-accent)] text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-[#5B21B6] transition disabled:opacity-60"
                >
                    {submitting ? 'Enviando...' : alreadyGraded ? 'Ya calificado' : 'Enviar calificaciones'}
                </button>

            </div>

            <ConfirmModalComponent />
        </div>
        );
    }

    export default GraderPage;
