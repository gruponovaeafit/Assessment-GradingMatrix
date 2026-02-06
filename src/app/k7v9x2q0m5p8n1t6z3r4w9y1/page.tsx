"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../Hooks/useAdminAuth";
import { Spinner } from "../components/UI/Loading";
import { showToast } from "../components/UI/Toast";
import { authFetch } from "@/lib/authFetch";

type GrupoEstudiantil = {
  id: number;
  nombre: string;
  descripcion: string | null;
};

type Assessment = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  grupoId: number | null;
  grupoNombre: string | null;
};

type AdminUser = {
  id: number;
  correo: string;
  assessmentId: number;
  assessmentNombre: string | null;
  grupoNombre: string | null;
};

export default function AdminAdminPanel() {
  const { isAdmin, isLoading: authLoading, requireAdmin, logout, getAuthHeaders } = useAdminAuth();

  const [gruposEstudiantiles, setGruposEstudiantiles] = useState<GrupoEstudiantil[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [assessmentNombre, setAssessmentNombre] = useState("");
  const [assessmentDescripcion, setAssessmentDescripcion] = useState("");
  const [assessmentGrupoId, setAssessmentGrupoId] = useState("");
  const [assessmentActivo, setAssessmentActivo] = useState(true);
  const [creatingAssessment, setCreatingAssessment] = useState(false);
  const [autoAssessmentName, setAutoAssessmentName] = useState(true);
  const [creatingBulkAssessments, setCreatingBulkAssessments] = useState(false);
  const [creatingBulkAdmins, setCreatingBulkAdmins] = useState(false);
  const [bulkAdminResults, setBulkAdminResults] = useState<
    { correo: string; password: string; assessment: string }[]
  >([]);

  const [adminAssessmentId, setAdminAssessmentId] = useState("");
  const [adminNombre, setAdminNombre] = useState("");
  const [adminPersonalEmail, setAdminPersonalEmail] = useState("");
  const [adminCorreo, setAdminCorreo] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [autoAdminCreds, setAutoAdminCreds] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [adminEdits, setAdminEdits] = useState<
    Record<number, { correo: string; assessmentId: string; password: string }>
  >({});
  const [assessmentEdits, setAssessmentEdits] = useState<
    Record<number, { descripcion: string; activo: boolean; grupoId: string }>
  >({});

  useEffect(() => {
    requireAdmin();
  }, [requireAdmin]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const loadData = async () => {
      try {
        const [groupsResponse, assessmentsResponse] = await Promise.all([
          authFetch(
            "/api/grupo-estudiantil/list",
            { headers: { ...getAuthHeaders() } },
            () => logout()
          ),
          authFetch(
            "/api/assessment/list-with-group",
            { headers: { ...getAuthHeaders() } },
            () => logout()
          ),
        ]);

        if (!groupsResponse.ok) {
          const error = await groupsResponse.json();
          throw new Error(error?.error || "Error al cargar grupos estudiantiles");
        }

        if (!assessmentsResponse.ok) {
          const error = await assessmentsResponse.json();
          throw new Error(error?.error || "Error al cargar assessments");
        }

        const groupsData = await groupsResponse.json();
        const assessmentsData = await assessmentsResponse.json();
        setGruposEstudiantiles(groupsData || []);
        setAssessments(assessmentsData || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al cargar datos";
        showToast.error(message);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [authLoading, isAdmin, getAuthHeaders, logout]);

  useEffect(() => {
    if (assessments.length === 0) return;
    setAssessmentEdits((prev) => {
      const next = { ...prev };
      assessments.forEach((assessment) => {
        if (!next[assessment.id]) {
          next[assessment.id] = {
            descripcion: assessment.descripcion ?? "",
            activo: assessment.activo,
            grupoId: assessment.grupoId ? String(assessment.grupoId) : "",
          };
        }
      });
      return next;
    });
  }, [assessments]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const loadAdmins = async () => {
      setLoadingAdmins(true);
      try {
        const response = await authFetch(
          "/api/staff/admins",
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Error al cargar admins");
        }
        setAdmins(payload || []);
        setAdminEdits((prev) => {
          const next = { ...prev };
          (payload || []).forEach((admin: AdminUser) => {
            if (!next[admin.id]) {
              next[admin.id] = {
                correo: admin.correo,
                assessmentId: String(admin.assessmentId),
                password: "",
              };
            }
          });
          return next;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al cargar admins";
        showToast.error(message);
      } finally {
        setLoadingAdmins(false);
      }
    };

    loadAdmins();
  }, [authLoading, isAdmin, getAuthHeaders, logout]);

  const selectedGroupLabel = useMemo(() => {
    if (!assessmentGrupoId) return null;
    const match = gruposEstudiantiles.find((group) => String(group.id) === assessmentGrupoId);
    return match ? match.nombre : null;
  }, [assessmentGrupoId, gruposEstudiantiles]);

  const buildAssessmentName = () => {
    if (!assessmentGrupoId) return "";
    const now = new Date();
    const year = now.getFullYear();
    const semester = now.getMonth() < 6 ? 1 : 2;
    const groupName = selectedGroupLabel ?? "Grupo";
    const sanitizedGroup = groupName
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");
    return `Assessment_${sanitizedGroup}_${year}_S${semester}`;
  };

  const generatePassword = (length = 16) => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%";
    const all = `${upper}${lower}${numbers}${symbols}`;
    const required = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];
    const values = new Uint32Array(Math.max(length, required.length));
    window.crypto.getRandomValues(values);
    const rest = Array.from(values, (val) => all[val % all.length]).slice(0, length - required.length);
    const merged = [...required, ...rest];
    for (let i = merged.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [merged[i], merged[j]] = [merged[j], merged[i]];
    }
    return merged.join("");
  };

  const shortHash = (input: string) => {
    let hash = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return Math.abs(hash).toString(36).slice(0, 6);
  };

  const buildAdminEmail = (assessmentId: string, nombre?: string, personalEmail?: string) => {
    const assessment = assessments.find((item) => String(item.id) === assessmentId);
    const baseDomain = assessment?.grupoNombre || assessment?.nombre || assessmentId;
    const domainSlug = baseDomain
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");
    const baseSeed =
      (nombre && personalEmail && `${nombre}|${personalEmail}`) ||
      (nombre ? nombre : "") ||
      (personalEmail ? personalEmail : "") ||
      assessment?.nombre ||
      `${assessmentId}`;
    const seed = `${baseSeed}|${assessmentId}`;
    const hash = shortHash(seed);
    return `${hash}_${assessmentId}@${domainSlug || "grupo"}.agm`;
  };

  const generateAdminCreds = (assessmentId: string) => {
    if (!assessmentId) return;
    setAdminCorreo(buildAdminEmail(assessmentId, adminNombre, adminPersonalEmail));
    setAdminPassword(generatePassword());
    setShowAdminPassword(true);
  };

  useEffect(() => {
    if (!autoAssessmentName) return;
    const nextName = buildAssessmentName();
    if (nextName) {
      setAssessmentNombre(nextName);
    }
  }, [autoAssessmentName, assessmentGrupoId, selectedGroupLabel]);

  useEffect(() => {
    if (!autoAdminCreds || !adminAssessmentId) return;
    generateAdminCreds(adminAssessmentId);
  }, [autoAdminCreds, adminAssessmentId]);

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessmentNombre || !assessmentGrupoId) {
      showToast.error("Nombre y Grupo Estudiantil son obligatorios.");
      return;
    }

    setCreatingAssessment(true);
    try {
      const response = await authFetch(
        "/api/assessment/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            nombre: assessmentNombre,
            descripcion: assessmentDescripcion,
            grupoEstudiantilId: assessmentGrupoId,
            activo: assessmentActivo,
          }),
        },
        () => logout()
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error al crear assessment");
      }

      showToast.success("Assessment creado correctamente");
      setAssessmentNombre("");
      setAssessmentDescripcion("");
      setAssessmentGrupoId("");
      setAssessmentActivo(true);
      setAssessments((prev) => [
        ...prev,
        {
          id: payload.ID_Assessment,
          nombre: assessmentNombre,
          descripcion: assessmentDescripcion || null,
          activo: assessmentActivo,
          grupoId: assessmentGrupoId ? Number(assessmentGrupoId) : null,
          grupoNombre:
            gruposEstudiantiles.find((group) => String(group.id) === assessmentGrupoId)?.nombre ?? null,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear assessment";
      showToast.error(message);
    } finally {
      setCreatingAssessment(false);
    }
  };

  const handleCreateAssessmentsForAllGroups = async () => {
    if (gruposEstudiantiles.length === 0) {
      showToast.error("No hay grupos estudiantiles disponibles.");
      return;
    }

    setCreatingBulkAssessments(true);
    try {
      const now = new Date();
      const year = now.getFullYear();
      const semester = now.getMonth() < 6 ? 1 : 2;
      const existingNames = new Set(assessments.map((item) => item.nombre.toLowerCase()));
      const payloads = gruposEstudiantiles.map((grupo) => {
        const nombre = `Assessment_${grupo.nombre
          .trim()
          .replace(/[^a-zA-Z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .replace(/_+/g, "_")}_${year}_S${semester}`;
        return {
          nombre,
          grupoEstudiantilId: grupo.id,
          exists: existingNames.has(nombre.toLowerCase()),
        };
      });

      const results = await Promise.all(
        payloads.map((body) => {
          if (body.exists) {
            return Promise.resolve({
              ok: false,
              skipped: true,
              payload: { error: "Assessment ya existe" },
              nombre: body.nombre,
              idGrupo: body.grupoEstudiantilId,
            });
          }
          return authFetch(
            "/api/assessment/create",
            {
              method: "POST",
              headers: { "Content-Type": "application/json", ...getAuthHeaders() },
              body: JSON.stringify({
                nombre: body.nombre,
                descripcion: "",
                grupoEstudiantilId: body.grupoEstudiantilId,
                activo: assessmentActivo,
              }),
            },
            () => logout()
          ).then(async (response) => {
            const payload = await response.json();
            const message = String(payload?.error || "").toLowerCase();
            const skippedByError = !response.ok && (message.includes("duplicate") || message.includes("existe"));
            return {
              ok: response.ok,
              skipped: skippedByError,
              payload,
              nombre: body.nombre,
              idGrupo: body.grupoEstudiantilId,
            };
          });
        })
      );

      const successes = results.filter((item) => item.ok);
      const failures = results.filter((item) => !item.ok && !item.skipped);
      const skipped = results.filter((item) => item.skipped);

      if (successes.length > 0) {
        setAssessments((prev) => [
          ...prev,
          ...successes.map((item) => ({
            id: item.payload.ID_Assessment,
            nombre: item.nombre,
            descripcion: "",
            activo: assessmentActivo,
            grupoId: item.idGrupo,
            grupoNombre: gruposEstudiantiles.find((g) => g.id === item.idGrupo)?.nombre ?? null,
          })),
        ]);
        showToast.success(`Assessments creados: ${successes.length}`);
      }

      if (failures.length > 0) {
        showToast.error(`No se pudieron crear: ${failures.length}`);
      }
      if (skipped.length > 0) {
        showToast.error(`Omitidos (ya existen): ${skipped.length}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear assessments";
      showToast.error(message);
    } finally {
      setCreatingBulkAssessments(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminAssessmentId || !adminCorreo || !adminPassword) {
      showToast.error("Assessment, correo y contraseña son obligatorios.");
      return;
    }

    setCreatingAdmin(true);
    try {
      const response = await authFetch(
        "/api/staff/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            assessmentId: adminAssessmentId,
            correo: adminCorreo,
            password: adminPassword,
            rol: "admin",
          }),
        },
        () => logout()
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error al crear administrador");
      }

      showToast.success("Administrador creado correctamente");
      setAdminAssessmentId("");
      setAdminNombre("");
      setAdminPersonalEmail("");
      setAdminCorreo("");
      setAdminPassword("");
      setAdmins((prev) => [
        ...prev,
        {
          id: payload.ID_Staff,
          correo: adminCorreo,
          assessmentId: Number(adminAssessmentId),
          assessmentNombre:
            assessments.find((assessment) => String(assessment.id) === adminAssessmentId)?.nombre ?? null,
          grupoNombre:
            assessments.find((assessment) => String(assessment.id) === adminAssessmentId)?.grupoNombre ??
            null,
        },
      ]);
      setAdminEdits((prev) => ({
        ...prev,
        [payload.ID_Staff]: {
          correo: adminCorreo,
          assessmentId: adminAssessmentId,
          password: "",
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear administrador";
      showToast.error(message);
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleCreateAdminsForAllAssessments = async () => {
    if (assessments.length === 0) {
      showToast.error("No hay assessments disponibles.");
      return;
    }

    setBulkAdminResults([]);
    setCreatingBulkAdmins(true);
    try {
      const existingEmails = new Set(admins.map((admin) => admin.correo.toLowerCase()));
      const results = await Promise.all(
        assessments.map((assessment) => {
          const correo = buildAdminEmail(String(assessment.id));
          const password = generatePassword();
          if (existingEmails.has(correo.toLowerCase())) {
            return Promise.resolve({
              ok: false,
              skipped: true,
              correo,
              password,
              assessment: assessment.nombre,
              assessmentId: assessment.id,
            });
          }
          return authFetch(
            "/api/staff/create",
            {
              method: "POST",
              headers: { "Content-Type": "application/json", ...getAuthHeaders() },
              body: JSON.stringify({
                assessmentId: assessment.id,
                correo,
                password,
                rol: "admin",
              }),
            },
            () => logout()
          ).then(async (response) => {
            const payload = await response.json();
            const message = String(payload?.error || "").toLowerCase();
            const skippedByError = !response.ok && (message.includes("duplicate") || message.includes("existe"));
            return {
              ok: response.ok,
              skipped: skippedByError,
              payload,
              correo,
              password,
              assessment: assessment.nombre,
              assessmentId: assessment.id,
            };
          });
        })
      );

      const successes = results.filter((item) => item.ok);
      const failures = results.filter((item) => !item.ok && !item.skipped);
      const skipped = results.filter((item) => item.skipped);

      if (successes.length > 0) {
        setBulkAdminResults(
          successes.map((item) => ({
            correo: item.correo,
            password: item.password,
            assessment: item.assessment,
          }))
        );
        showToast.success(`Admins creados: ${successes.length}`);
        setAdmins((prev) => [
          ...prev,
          ...successes.map((item) => ({
            id: item.payload.ID_Staff,
            correo: item.correo,
            assessmentId: item.assessmentId,
            assessmentNombre: item.assessment,
            grupoNombre:
              assessments.find((assessment) => assessment.id === item.assessmentId)?.grupoNombre ?? null,
          })),
        ]);
        setAdminEdits((prev) => {
          const next = { ...prev };
          successes.forEach((item) => {
            next[item.payload.ID_Staff] = {
              correo: item.correo,
              assessmentId: String(item.assessmentId),
              password: "",
            };
          });
          return next;
        });
      }

      if (failures.length > 0) {
        showToast.error(`No se pudieron crear admins: ${failures.length}`);
      }
      if (skipped.length > 0) {
        showToast.error(`Admins omitidos (ya existen): ${skipped.length}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al crear admins";
      showToast.error(message);
    } finally {
      setCreatingBulkAdmins(false);
    }
  };

  const handleUpdateAssessment = async (assessmentId: number) => {
    const edit = assessmentEdits[assessmentId];
    if (!edit) return;
    try {
      const response = await authFetch(
        "/api/assessment/update",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            assessmentId,
            descripcion: edit.descripcion,
            activo: edit.activo,
            grupoEstudiantilId: edit.grupoId,
          }),
        },
        () => logout()
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error al actualizar assessment");
      }

      setAssessments((prev) =>
        prev.map((assessment) =>
          assessment.id === assessmentId
            ? {
                ...assessment,
                descripcion: edit.descripcion,
                activo: edit.activo,
                grupoId: edit.grupoId ? Number(edit.grupoId) : null,
                grupoNombre:
                  gruposEstudiantiles.find((group) => String(group.id) === edit.grupoId)?.nombre ?? null,
              }
            : assessment
        )
      );
      showToast.success("Assessment actualizado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar assessment";
      showToast.error(message);
    }
  };

  const handleUpdateAdmin = async (adminId: number) => {
    const edit = adminEdits[adminId];
    if (!edit) return;
    try {
      const response = await authFetch(
        "/api/staff/update",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            staffId: adminId,
            correo: edit.correo,
            password: edit.password || undefined,
            assessmentId: edit.assessmentId,
          }),
        },
        () => logout()
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Error al actualizar admin");
      }

      setAdmins((prev) =>
        prev.map((admin) =>
          admin.id === adminId
            ? {
                ...admin,
                correo: edit.correo,
                assessmentId: Number(edit.assessmentId),
                assessmentNombre:
                  assessments.find((assessment) => String(assessment.id) === edit.assessmentId)?.nombre ??
                  admin.assessmentNombre,
                grupoNombre:
                  assessments.find((assessment) => String(assessment.id) === edit.assessmentId)?.grupoNombre ??
                  admin.grupoNombre,
              }
            : admin
        )
      );
      setAdminEdits((prev) => ({
        ...prev,
        [adminId]: {
          ...prev[adminId],
          password: "",
        },
      }));
      showToast.success("Admin actualizado");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar admin";
      showToast.error(message);
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <Spinner size="xl" color="custom" customColor="var(--color-accent)" />
        <p className="text-[color:var(--color-text)] text-xl mt-4">Verificando acceso...</p>
      </div>
    );
  }

  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
        <Spinner size="lg" color="custom" customColor="var(--color-accent)" />
        <p className="text-gray-500 mt-3">Cargando panel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Panel Admin de Assessment
          </h1>
          <p className="text-sm text-gray-500">
            Ruta privada: /k7v9x2q0m5p8n1t6z3r4w9y1
          </p>
        </div>
        <button
          onClick={logout}
          className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Cerrar Sesión
        </button>
      </div>

      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-100 shadow rounded-2xl p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Crear Assessment</h2>
          <p className="text-sm text-gray-500 mb-4">
            Cada assessment queda ligado a un Grupo Estudiantil.
          </p>

          <form onSubmit={handleCreateAssessment} className="space-y-3">
            <select
              value={assessmentGrupoId}
              onChange={(e) => setAssessmentGrupoId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            >
              <option value="">Grupo Estudiantil</option>
              {gruposEstudiantiles.map((grupo) => (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Descripción (opcional)"
              value={assessmentDescripcion}
              onChange={(e) => setAssessmentDescripcion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm min-h-[90px]"
            />

            {selectedGroupLabel && (
              <p className="text-xs text-gray-500">
                Grupo seleccionado: <span className="font-semibold">{selectedGroupLabel}</span>
              </p>
            )}

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={assessmentActivo}
                onChange={(e) => setAssessmentActivo(e.target.checked)}
              />
              Activo al crear
            </label>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoAssessmentName}
                  onChange={(e) => setAutoAssessmentName(e.target.checked)}
                />
                Autogenerar nombre (Assessment + grupo + año/semestre)
              </label>
              <button
                type="button"
                onClick={() => {
                  const nextName = buildAssessmentName();
                  if (nextName) {
                    setAssessmentNombre(nextName);
                    showToast.success("Nombre generado");
                  } else {
                    showToast.error("Selecciona un grupo estudiantil primero");
                  }
                }}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:border-[color:var(--color-accent)]"
              >
                Generar ahora
              </button>
            </div>
            <input
              type="text"
              placeholder="Nombre del Assessment"
              value={assessmentNombre}
              onChange={(e) => setAssessmentNombre(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            />

            <button
              type="submit"
              disabled={creatingAssessment}
              className="w-full bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              {creatingAssessment ? "Creando..." : "Crear Assessment"}
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-100 shadow rounded-2xl p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Crear Administrador</h2>
          <p className="text-sm text-gray-500 mb-4">
            El administrador queda asignado al Assessment (grupo estudiantil asociado).
          </p>

          <form onSubmit={handleCreateAdmin} className="space-y-3">
            <select
              value={adminAssessmentId}
              onChange={(e) => setAdminAssessmentId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            >
              <option value="">Assessment</option>
              {assessments.map((assessment) => (
                <option key={assessment.id} value={assessment.id}>
                  {assessment.nombre} {assessment.activo ? "(Activo)" : "(Inactivo)"}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nombre del admin"
              value={adminNombre}
              onChange={(e) => setAdminNombre(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            />
            <input
              type="email"
              placeholder="Correo personal (opcional)"
              value={adminPersonalEmail}
              onChange={(e) => setAdminPersonalEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            />
            <input
              type="email"
              placeholder="Correo del admin"
              value={adminCorreo}
              onChange={(e) => setAdminCorreo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            />
            <div className="flex flex-col gap-2">
              <input
                type={showAdminPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Usa autogenerar o ingresa una contraseña manual.</span>
                <button
                  type="button"
                  onClick={() => setShowAdminPassword((prev) => !prev)}
                  className="px-2 py-1 rounded-md border border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-white hover:bg-[#5B21B6] transition text-xs font-semibold"
                >
                  {showAdminPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={autoAdminCreds}
                  onChange={(e) => setAutoAdminCreds(e.target.checked)}
                />
                Autogenerar credenciales
              </label>
              <button
                type="button"
                onClick={() => {
                  if (!adminAssessmentId) {
                    showToast.error("Selecciona un assessment primero");
                    return;
                  }
                  generateAdminCreds(adminAssessmentId);
                  showToast.success("Credenciales generadas");
                }}
                className="px-3 py-1 rounded-md border border-gray-300 text-gray-700 hover:border-[color:var(--color-accent)]"
              >
                Generar ahora
              </button>
            </div>
            <button
              type="submit"
              disabled={creatingAdmin}
              className="w-full bg-success hover:bg-success-dark text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-60"
            >
              {creatingAdmin ? "Creando..." : "Crear Admin"}
            </button>
          </form>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto mt-6">
        <div className="bg-white border border-gray-100 shadow rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Acciones masivas</h2>
            <p className="text-sm text-gray-500">
              Crea assessments o admins para todos los registros existentes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleCreateAssessmentsForAllGroups}
              disabled={creatingBulkAssessments}
              className="w-full bg-white border-2 border-[color:var(--color-accent)] text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60"
            >
              {creatingBulkAssessments ? "Creando en todos..." : "Crear assessment para todos los grupos"}
            </button>
            <button
              type="button"
              onClick={handleCreateAdminsForAllAssessments}
              disabled={creatingBulkAdmins}
              className="w-full bg-white border-2 border-success text-success hover:bg-success hover:text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60"
            >
              {creatingBulkAdmins ? "Creando admins..." : "Crear admin para todos los assessments"}
            </button>
          </div>

          {bulkAdminResults.length > 0 && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
              <p className="font-semibold mb-2">Credenciales generadas:</p>
              <div className="space-y-1">
                {bulkAdminResults.map((item) => (
                  <div key={`${item.correo}-${item.assessment}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="font-medium">{item.assessment}</span>
                    <span className="text-xs sm:text-sm">
                      {item.correo} / {item.password}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto mt-6">
        <div className="bg-white border border-gray-100 shadow rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Editar Assessments</h2>
            <p className="text-sm text-gray-500">
              Modifica grupo, descripción y activo. El nombre no se edita aquí.
            </p>
          </div>
          <div className="space-y-4">
            {assessments.map((assessment) => {
              const edit = assessmentEdits[assessment.id];
              if (!edit) return null;
              return (
                <div key={assessment.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{assessment.nombre}</p>
                      <p className="text-xs text-gray-500">ID: {assessment.id}</p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={edit.activo}
                        onChange={(e) =>
                          setAssessmentEdits((prev) => ({
                            ...prev,
                            [assessment.id]: { ...edit, activo: e.target.checked },
                          }))
                        }
                      />
                      Activo
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select
                      value={edit.grupoId}
                      onChange={(e) =>
                        setAssessmentEdits((prev) => ({
                          ...prev,
                          [assessment.id]: { ...edit, grupoId: e.target.value },
                        }))
                      }
                      className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
                    >
                      <option value="">Grupo Estudiantil</option>
                      {gruposEstudiantiles.map((grupo) => (
                        <option key={grupo.id} value={grupo.id}>
                          {grupo.nombre}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={edit.descripcion}
                      onChange={(e) =>
                        setAssessmentEdits((prev) => ({
                          ...prev,
                          [assessment.id]: { ...edit, descripcion: e.target.value },
                        }))
                      }
                      placeholder="Descripción"
                      className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm min-h-[80px] sm:col-span-2"
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleUpdateAssessment(assessment.id)}
                      className="px-4 py-2 rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-sm font-medium transition"
                    >
                      Guardar cambios
                    </button>
                  </div>
                </div>
              );
            })}
            {assessments.length === 0 && (
              <p className="text-sm text-gray-500">No hay assessments registrados.</p>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mx-auto mt-6">
        <div className="bg-white border border-gray-100 shadow rounded-2xl p-5 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Editar Administradores</h2>
            <p className="text-sm text-gray-500">
              Ajusta correo, assessment o contraseña. La contraseña solo se cambia si la escribes.
            </p>
          </div>

          {loadingAdmins ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Spinner size="sm" color="custom" customColor="var(--color-accent)" />
              Cargando admins...
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => {
                const edit = adminEdits[admin.id];
                if (!edit) return null;
                return (
                  <div key={admin.id} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{admin.correo}</p>
                        <p className="text-xs text-gray-500">
                          {admin.assessmentNombre || "Assessment"} · {admin.grupoNombre || "Grupo"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="email"
                        value={edit.correo}
                        onChange={(e) =>
                          setAdminEdits((prev) => ({
                            ...prev,
                            [admin.id]: { ...edit, correo: e.target.value },
                          }))
                        }
                        placeholder="Correo"
                        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
                      />
                      <select
                        value={edit.assessmentId}
                        onChange={(e) =>
                          setAdminEdits((prev) => ({
                            ...prev,
                            [admin.id]: { ...edit, assessmentId: e.target.value },
                          }))
                        }
                        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
                      >
                        <option value="">Assessment</option>
                        {assessments.map((assessment) => (
                          <option key={assessment.id} value={assessment.id}>
                            {assessment.nombre}
                          </option>
                        ))}
                      </select>
                      <input
                        type="password"
                        value={edit.password}
                        onChange={(e) =>
                          setAdminEdits((prev) => ({
                            ...prev,
                            [admin.id]: { ...edit, password: e.target.value },
                          }))
                        }
                        placeholder="Nueva contraseña (opcional)"
                        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleUpdateAdmin(admin.id)}
                        className="px-4 py-2 rounded-lg bg-success hover:bg-success-dark text-white text-sm font-medium transition"
                      >
                        Guardar cambios
                      </button>
                    </div>
                  </div>
                );
              })}
              {admins.length === 0 && (
                <p className="text-sm text-gray-500">No hay administradores registrados.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
