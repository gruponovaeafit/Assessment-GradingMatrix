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
    const [groups, setGroups] = useState<{ id: number; nombre: string }[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [usuarios, setUsuarios] = useState<{
        ID: number; Nombre: ReactNode; ID_Persona: number; Grupo: string; role: string; Photo?: string;
    }[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const touchStartX = React.useRef<number>(0);
    const SWIPE_THRESHOLD = 80;
    const DRAG_CLAMP = 120;
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
    const [showBaseInfoPopup, setShowBaseInfoPopup] = useState(false);
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
        const id_Calificador = parsedData?.id_Calificador;
        const authToken = localStorage.getItem("authToken");
        const authHeaders: HeadersInit = authToken ? { Authorization: `Bearer ${authToken}` } : {};
        const jsonHeaders: HeadersInit = { 'Content-Type': 'application/json', ...authHeaders };

        if (!id_Calificador) {
            setLoading(false);
            return;
        }

        async function fetchGroups() {
            try {
                const response = await fetch('/api/grader/groups', {
                    method: 'POST',
                    headers: jsonHeaders,
                    body: JSON.stringify({ idCalificador: id_Calificador }),
                });
                if (!response.ok) throw new Error("Error al cargar grupos");
                const data = await response.json();
                const list = Array.isArray(data) ? data : [];
                setGroups(list);
                if (list.length > 0) setSelectedGroupId((prev) => (prev ? prev : String(list[0].id)));
            } catch (error) {
                console.error("❌ Error obteniendo grupos:", error);
            } finally {
                setLoading(false);
            }
        }

        async function fetchBaseData() {
            const idBase = parsedData?.id_base;
            if (!idBase) return;
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

        fetchGroups();
        fetchBaseData();
        fetchNombreCalificador();
    }, [storedData]);

    // Al elegir grupo: cargar participantes y verificar si ya calificó
    useEffect(() => {
        const parsedData = localStorage.getItem("storedData") ? JSON.parse(localStorage.getItem("storedData")!) : null;
        const id_Calificador = parsedData?.id_Calificador;
        const idBase = parsedData?.id_base;
        const authToken = localStorage.getItem("authToken");
        const jsonHeaders: HeadersInit = authToken
            ? { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }
            : { 'Content-Type': 'application/json' };

        if (!selectedGroupId || !id_Calificador || !idBase) {
            setUsuarios([]);
            return;
        }

        setLoadingParticipants(true);
        setCalificaciones({});
        setErrores([]);
        setCarouselIndex(0);

        (async () => {
            try {
                const [participantsRes, checkRes] = await Promise.all([
                    fetch('/api/grader/participants', {
                        method: 'POST',
                        headers: jsonHeaders,
                        body: JSON.stringify({ idCalificador: id_Calificador, idGrupo: Number(selectedGroupId) }),
                    }),
                    fetch('/api/check-already-graded', {
                        method: 'POST',
                        headers: jsonHeaders,
                        body: JSON.stringify({
                            idCalificador: id_Calificador,
                            idBase,
                            idGrupo: Number(selectedGroupId),
                        }),
                    }),
                ]);

                const participantsData = await participantsRes.json();
                if (participantsRes.ok) setUsuarios(Array.isArray(participantsData) ? participantsData : []);

                if (checkRes.ok) {
                    const checkData = await checkRes.json();
                    setAlreadyGraded(!!checkData.alreadyGraded);
                    if (checkData.alreadyGraded) showToast.error('Ya has calificado a este grupo anteriormente');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingParticipants(false);
            }
        })();
    }, [selectedGroupId]);

    useEffect(() => {
        if (!loadingParticipants && selectedGroupId) setCheckingStatus(false);
    }, [loadingParticipants, selectedGroupId]);


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
                body: JSON.stringify({
                    calificaciones: payload,
                    idGrupo: selectedGroupId ? Number(selectedGroupId) : undefined,
                }),
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
    
    const participantesToGrade = usuarios.filter((u) => u.role !== 'Impostor');
    const hasParticipants = participantesToGrade.length > 0;
    const currentIndex = hasParticipants ? (carouselIndex % participantesToGrade.length + participantesToGrade.length) % participantesToGrade.length : 0;

    const goPrev = () => {
        if (!hasParticipants) return;
        setCarouselIndex((i) => (i <= 0 ? participantesToGrade.length - 1 : i - 1));
    };
    const goNext = () => {
        if (!hasParticipants) return;
        setCarouselIndex((i) => (i >= participantesToGrade.length - 1 ? 0 : i + 1));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.targetTouches[0].clientX;
        setIsDragging(true);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        const currentX = e.targetTouches[0].clientX;
        const diff = currentX - touchStartX.current;
        const clamped = Math.max(-DRAG_CLAMP, Math.min(DRAG_CLAMP, diff));
        setDragOffset(clamped);
    };
    const handleTouchEnd = () => {
        setIsDragging(false);
        if (Math.abs(dragOffset) >= SWIPE_THRESHOLD) {
            if (dragOffset > 0) goPrev();
            else goNext();
            setDragOffset(0);
        } else {
            setDragOffset(0);
        }
    };

    const cardWidthPercent = hasParticipants ? 100 / participantesToGrade.length : 100;
    const stripTranslate = hasParticipants
        ? `calc(-${currentIndex * cardWidthPercent}% + ${dragOffset}px)`
        : '0';

    return (
        <div className="flex flex-col items-center min-h-screen py-4 sm:py-10 px-4 bg-white">
            {/* Popup nombre y descripción de la base */}
            {showBaseInfoPopup && (
                <div
                    className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/50"
                    onClick={() => setShowBaseInfoPopup(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="base-info-title"
                >
                    <div
                        className="bg-white rounded-xl shadow-xl max-w-md w-full p-5 border-2 border-[color:var(--color-accent)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 id="base-info-title" className="text-lg font-bold text-gray-900 mb-2">
                            {baseData?.Nombre ?? 'Base'}
                        </h2>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                            {baseData?.Descripcion ?? 'No hay descripción disponible.'}
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowBaseInfoPopup(false)}
                            className="mt-4 w-full py-2 rounded-lg bg-[color:var(--color-accent)] text-white font-semibold hover:bg-[#5B21B6] transition"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}

            <div className="w-full max-w-2xl">
                {/* Selector de grupo: compacto */}
                {groups.length > 0 && (
                    <div className="mb-3">
                        <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="w-full rounded-lg px-3 py-2 border border-gray-300 text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
                            aria-label="Grupo a calificar"
                        >
                            {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {loadingParticipants && (
                    <div className="flex justify-center gap-2 items-center py-8">
                        <Spinner size="lg" color="primary-light" />
                        <span className="text-gray-500">Cargando participantes...</span>
                    </div>
                )}

                {!loading && groups.length === 0 && (
                    <div className="text-center py-8 text-gray-600">
                        <p className="text-lg">No hay grupos disponibles para calificar.</p>
                    </div>
                )}
                {!loadingParticipants && !hasParticipants && selectedGroupId && groups.length > 0 && (
                    <div className="text-center py-8 text-gray-600">
                        <p className="text-lg">No hay participantes en este grupo.</p>
                    </div>
                )}

                {!loadingParticipants && hasParticipants && (
                    <>
                        {alreadyGraded && (
                            <div className="w-full mb-4 px-4 py-3 rounded-lg bg-yellow-50 border-2 border-yellow-400">
                                <p className="text-center text-yellow-800 font-semibold text-sm">
                                    Ya has calificado a este grupo. No puedes volver a calificar.
                                </p>
                            </div>
                        )}

                        {/* Carrusel: en móvil solo deslizar; en escritorio flechas */}
                        <div className="flex items-center gap-2 w-full">
                            <button
                                type="button"
                                onClick={goPrev}
                                className="hidden md:flex p-3 rounded-full bg-[color:var(--color-accent)] text-white hover:bg-[#5B21B6] transition shrink-0"
                                aria-label="Anterior"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>

                            <div
                                className="flex-1 min-w-0 overflow-hidden rounded-2xl border-2 border-gray-200 shadow-lg bg-white touch-pan-y select-none md:select-auto"
                                onTouchStart={handleTouchStart}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={handleTouchEnd}
                            >
                                <div
                                    className="flex px-2 py-4 min-h-[200px]"
                                    style={{
                                        width: `${participantesToGrade.length * 100}%`,
                                        transform: `translateX(${stripTranslate})`,
                                        transition: isDragging ? 'none' : 'transform 0.25s ease-out',
                                    }}
                                >
                                    {participantesToGrade.map((usuario, idx) => (
                                        <div
                                            key={usuario.ID}
                                            className="flex-shrink-0 px-1 min-w-0 relative"
                                            style={{ flexBasis: `${cardWidthPercent}%` }}
                                        >
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setShowBaseInfoPopup(true); }}
                                                className="absolute top-0 right-2 z-10 w-7 h-7 rounded-full bg-[color:var(--color-accent)] text-white flex items-center justify-center text-sm font-bold shadow hover:bg-[#5B21B6] transition focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[color:var(--color-accent)]"
                                                aria-label="Ver información de la base"
                                            >
                                                ?
                                            </button>
                                            <div className="flex flex-col items-center gap-2 mb-4">
                                                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-gray-100 border-2 border-[color:var(--color-accent)] flex items-center justify-center">
                                                    {(typeof usuario.Photo === 'string' && usuario.Photo.trim()) ? (
                                                        <img
                                                            src={usuario.Photo}
                                                            alt={`Foto de ${usuario.Nombre}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                const t = e.target as HTMLImageElement;
                                                                t.style.display = 'none';
                                                                const p = t.parentElement;
                                                                if (p) p.innerHTML = `<span class="text-xl font-bold text-[color:var(--color-accent)]">${getInitials(usuario.Nombre)}</span>`;
                                                            }}
                                                        />
                                                    ) : (
                                                        <span className="text-xl font-bold text-[color:var(--color-accent)]">{getInitials(usuario.Nombre)}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-semibold text-gray-500">ID: {usuario.ID}</p>
                                                <p className="text-base font-bold text-gray-900 truncate max-w-full text-center">{usuario.Nombre}</p>
                                            </div>
                                            <div className="space-y-3">
                                                {[1, 2, 3].map((num) => {
                                                    const comportamiento = baseData?.[`Comportamiento${num}` as keyof typeof baseData] as string;
                                                    return (
                                                        <div key={num}>
                                                            <p className="text-xs font-semibold text-[color:var(--color-accent)]">Comportamiento {num}</p>
                                                            <p className="text-xs text-gray-500 mb-1">{comportamiento}</p>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={5}
                                                                step={1}
                                                                className={`w-full rounded-lg px-3 py-2 text-gray-900 text-center font-bold text-lg bg-white border-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] ${errores.includes(usuario.ID) ? 'border-yellow-400' : 'border-[color:var(--color-accent)]'}`}
                                                                value={calificaciones[usuario.ID]?.[`Calificacion_${num}` as CalificacionKey] ?? ''}
                                                                onChange={(e) => handleInputChange(usuario.ID, num, e.target.value)}
                                                                disabled={submitting || alreadyGraded}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-center text-xs text-gray-400 mt-3">
                                                {idx + 1} / {participantesToGrade.length}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={goNext}
                                className="hidden md:flex p-3 rounded-full bg-[color:var(--color-accent)] text-white hover:bg-[#5B21B6] transition shrink-0"
                                aria-label="Siguiente"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                        <p className="text-center text-xs text-gray-400 mt-2 md:hidden">Desliza para cambiar de participante</p>

                        <div className="w-full flex justify-center mt-6">
                            <button
                                onClick={handleSubmitGeneral}
                                disabled={submitting || alreadyGraded}
                                className="bg-[color:var(--color-accent)] text-white font-bold px-8 py-3 rounded-lg shadow hover:bg-[#5B21B6] transition disabled:opacity-60"
                            >
                                {submitting ? 'Enviando...' : alreadyGraded ? 'Ya calificado' : 'Enviar calificaciones'}
                            </button>
                        </div>
                    </>
                )}
            </div>
            <ConfirmModalComponent />
        </div>
    );
};

export default GraderPage;
