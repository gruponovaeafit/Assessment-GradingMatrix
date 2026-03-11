import { useState, useEffect, useCallback } from 'react';
import { showToast } from '@/components/UI/Toast';
import { 
  type Participant, 
  type CalificacionesType, 
  type CalificacionKey,
  type Group
} from '../schemas/graderSchemas';

export const useGraderActions = (
  usuarios: Participant[],
  selectedGroupId: string,
  alreadyGraded: boolean,
  setAlreadyGraded: (val: boolean) => void,
  groups: Group[],
  setGroups: (groups: Group[]) => void,
  setSelectedGroupId: (id: string) => void,
  setUsuarios: (u: Participant[]) => void,
  confirm: (opts: any) => Promise<boolean>,
  setIsLoading: (val: boolean) => void
) => {
  const [calificaciones, setCalificaciones] = useState<CalificacionesType>({});
  const [errores, setErrores] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const participantesToGrade = usuarios.filter((u) => u.role !== 'Impostor');

  // Reset local state when participants change
  useEffect(() => {
    setCalificaciones({});
    setErrores([]);
    setCarouselIndex(0);
  }, [usuarios]);

  // Load existing grades if already graded
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
        const jsonHeaders: HeadersInit = { 'Content-Type': 'application/json', ...authHeaders };

        const response = await fetch('/api/get-calificaciones-by-calificador', {
          method: 'POST',
          headers: jsonHeaders,
          body: JSON.stringify({ idCalificador: id_calificador, idBase: id_base }),
        });

        if (response.ok) {
          const data = await response.json();
          const calificacionesMap: CalificacionesType = {};
          
          data.calificaciones.forEach((cal: any) => {
            const usuario = usuarios.find(u => u.ID_Persona === cal.ID_Participante);
            if (usuario) {
              calificacionesMap[usuario.ID] = {
                Calificacion_1: cal.Calificacion_1,
                Calificacion_2: cal.Calificacion_2,
                Calificacion_3: cal.Calificacion_3,
              };
            }
          });
          setCalificaciones(calificacionesMap);
        }
      } catch (error) {
        console.error('❌ Error loading existing grades:', error);
      }
    };

    if (alreadyGraded && usuarios.length > 0) {
      loadExistingGrades();
    }
  }, [alreadyGraded, usuarios]);

  const handleInputChange = (id: number, calificacionNumber: number, value: string) => {
    // Convert directly. Number("3.5") is 3.5. Number("3,5") is NaN.
    const number = value === '' ? '' : Number(value);

    if (
      number !== '' &&
      (typeof number === 'number' && (!Number.isInteger(number) || number < 1 || number > 5))
    ) {
      return;
    }

    setCalificaciones(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [`Calificacion_${calificacionNumber}`]: number
      }
    }));
  };

  const validarTodasLasCalificaciones = useCallback(() => {
    const erroresLocales: number[] = [];
    for (const usuario of participantesToGrade) {
      const cal = calificaciones[usuario.ID];
      if (!cal || cal.Calificacion_1 === '' || cal.Calificacion_2 === '' || cal.Calificacion_3 === '') {
        erroresLocales.push(usuario.ID);
      }
    }
    setErrores(erroresLocales);
    return erroresLocales.length === 0;
  }, [participantesToGrade, calificaciones]);

  const handleSubmit = async () => {
    if (!validarTodasLasCalificaciones()) {
      showToast.error('Todos los participantes deben tener las 3 calificaciones asignadas');
      return;
    }

    if (alreadyGraded) return;

    const confirmed = await confirm({
      title: 'Confirmar envío',
      message: `Una vez enviado no podrás modificar ni volver a calificar este grupo. ¿Deseas continuar con el envío de las calificaciones de ${participantesToGrade.length} participantes?`,
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

    const payload = participantesToGrade.map((usuario) => {
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
      const jsonHeaders: HeadersInit = { 'Content-Type': 'application/json', ...authHeaders };

      const response = await fetch('/api/add-calificaciones', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          calificaciones: payload,
          idGrupo: selectedGroupId ? Number(selectedGroupId) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'ALREADY_GRADED') {
          setAlreadyGraded(true);
          return;
        }
        throw new Error(data.error || 'Error al enviar las calificaciones');
      }

      if (data.nuevoGrupo) {
        localStorage.setItem("id_grupo", data.nuevoGrupo);
      }

      const gradedGroupName = groups.find((g) => String(g.id) === selectedGroupId)?.nombre ?? `#${selectedGroupId}`;
      showToast.success(`Grupo "${gradedGroupName}" calificado con éxito`);

      setCalificaciones({});
      setErrores([]);
      setAlreadyGraded(false);

      const remainingGroups = groups.filter((g) => String(g.id) !== selectedGroupId);
      setGroups(remainingGroups);
      setSelectedGroupId(remainingGroups.length > 0 ? String(remainingGroups[0].id) : '');
      setUsuarios([]);

    } catch (error: any) {
      console.error('❌ Error submitting grades:', error);
      showToast.error(error.message || 'Error al enviar las calificaciones. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  const goPrev = () => {
    if (participantesToGrade.length === 0) return;
    setCarouselIndex((i) => (i <= 0 ? participantesToGrade.length - 1 : i - 1));
  };
  
  const goNext = () => {
    if (participantesToGrade.length === 0) return;
    setCarouselIndex((i) => (i >= participantesToGrade.length - 1 ? 0 : i + 1));
  };

  return {
    calificaciones,
    errores,
    submitting,
    carouselIndex,
    setCarouselIndex,
    handleInputChange,
    handleSubmit,
    goPrev,
    goNext,
    participantesToGrade
  };
};
