import { useState, useEffect } from 'react';
import { type Group, type Participant, type BaseData, type CalificacionesType } from '../schemas/graderSchemas';

export const useGraderData = () => {
  const [loading, setLoading] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [usuarios, setUsuarios] = useState<Participant[]>([]);
  const [baseData, setBaseData] = useState<BaseData | null>(null);
  const [nombreCalificador, setNombreCalificador] = useState<string | null>(null);
  const [alreadyGraded, setAlreadyGraded] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Initial data fetch
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

    async function fetchData() {
      const idBase = parsedData?.id_base;
      try {
        const [groupsRes, baseRes, calificadorRes] = await Promise.all([
          fetch('/api/grader/groups', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ idCalificador: id_Calificador, idBase: idBase ?? undefined }),
          }),
          idBase ? fetch('/api/getBaseData', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ id_base: idBase }),
          }) : Promise.resolve(null),
          fetch('/api/getCalificador', {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify({ id_calificador: id_Calificador }),
          })
        ]);

        if (groupsRes.ok) {
          const data = await groupsRes.json();
          const list = Array.isArray(data) ? data : [];
          setGroups(list);
          if (list.length > 0) setSelectedGroupId(prev => prev ? prev : String(list[0].id));
        }

        if (baseRes && baseRes.ok) {
          const data = await baseRes.json();
          setBaseData(data);
        }

        if (calificadorRes.ok) {
          const data = await calificadorRes.json();
          setNombreCalificador(data.Correo);
        }
      } catch (error) {
        console.error("❌ Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Fetch participants when group changes
  useEffect(() => {
    const storedData = localStorage.getItem("storedData");
    const parsedData = storedData ? JSON.parse(storedData) : null;
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
    setCheckingStatus(true);

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

        if (participantsRes.ok) {
          const participantsData = await participantsRes.json();
          setUsuarios(Array.isArray(participantsData) ? participantsData : []);
        }

        if (checkRes.ok) {
          const checkData = await checkRes.json();
          setAlreadyGraded(!!checkData.alreadyGraded);
        }
      } catch (e) {
        console.error("❌ Error fetching group data:", e);
      } finally {
        setLoadingParticipants(false);
        setCheckingStatus(false);
      }
    })();
  }, [selectedGroupId]);

  return {
    loading,
    loadingParticipants,
    groups,
    setGroups,
    selectedGroupId,
    setSelectedGroupId,
    usuarios,
    setUsuarios,
    baseData,
    nombreCalificador,
    alreadyGraded,
    setAlreadyGraded,
    checkingStatus
  };
};
