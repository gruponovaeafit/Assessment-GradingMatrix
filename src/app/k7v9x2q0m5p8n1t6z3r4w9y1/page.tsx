"use client";

import { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "../Hooks/useAdminAuth";
import { Spinner } from "../components/UI/Loading";
import { showToast } from "../components/UI/Toast";
import { authFetch } from "@/lib/authFetch";
import { stringify } from "csv-stringify/sync";
import { saveAs } from "file-saver";

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

type MassActionItem = {
  key: string;
  title: string;
  subtitle?: string;
  status: "crear" | "omitir";
};

export default function AdminAdminPanel() {
  const { isAdmin, isSuperAdmin, isLoading: authLoading, requireSuperAdmin, logout, getAuthHeaders } =
    useAdminAuth();

  const [gruposEstudiantiles, setGruposEstudiantiles] = useState<GrupoEstudiantil[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [assessmentActivo, setAssessmentActivo] = useState(true);
  const [creatingBulkAssessments, setCreatingBulkAssessments] = useState(false);
  const [creatingBulkAdmins, setCreatingBulkAdmins] = useState(false);
  const [massAction, setMassAction] = useState<{
    title: string;
    description: string;
    items: MassActionItem[];
    onConfirm: () => void;
  } | null>(null);

  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [adminEdits, setAdminEdits] = useState<Record<number, { correo: string; password: string }>>({});
  const [assessmentEdits, setAssessmentEdits] = useState<
    Record<number, { descripcion: string; activo: boolean; grupoId: string }>
  >({});
  const [assessmentFilter, setAssessmentFilter] = useState<"activos" | "inactivos" | "todos">(
    "activos"
  );
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [assessmentGroupFilter, setAssessmentGroupFilter] = useState<string>("todos");
  const [assessmentYearFilter, setAssessmentYearFilter] = useState<string>("todos");
  const [adminFilter, setAdminFilter] = useState<"activos" | "todos">("activos");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminGroupFilter, setAdminGroupFilter] = useState<string>("todos");
  const [adminYearFilter, setAdminYearFilter] = useState<string>("todos");

  useEffect(() => {
    requireSuperAdmin();
  }, [requireSuperAdmin]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    const loadData = async () => {
      try {
        const response = await authFetch(
          "/api/admin/panel-data",
          { headers: { ...getAuthHeaders() } },
          () => logout()
        );
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "Error al cargar datos");
        }
        setGruposEstudiantiles(payload.groups || []);
        setAssessments(payload.assessments || []);
        setAdmins(payload.admins || []);
        setAdminEdits((prev) => {
          const next = { ...prev };
          (payload.admins || []).forEach((admin: AdminUser) => {
            if (!next[admin.id]) {
              next[admin.id] = {
                correo: admin.correo,
                password: "",
              };
            }
          });
          return next;
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Error al cargar datos";
        showToast.error(message);
      } finally {
        setLoadingData(false);
        setLoadingAdmins(false);
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

  const activeAssessments = useMemo(() => {
    const actives = assessments.filter((assessment) => assessment.activo);
    const byGroup = new Map<number | string, Assessment>();
    actives.forEach((assessment) => {
      const key = assessment.grupoId ?? `no-group-${assessment.id}`;
      const current = byGroup.get(key);
      if (!current || assessment.id > current.id) {
        byGroup.set(key, assessment);
      }
    });
    return Array.from(byGroup.values());
  }, [assessments]);

  const getBulkAssessmentPayloads = () => {
    const now = new Date();
    const year = now.getFullYear();
    const semester = now.getMonth() < 6 ? 1 : 2;
    const existingNames = new Set(assessments.map((item) => item.nombre.toLowerCase()));
    return gruposEstudiantiles.map((grupo) => {
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
  };

  const getBulkAdminPayloads = () => {
    const existingEmails = new Set(admins.map((admin) => admin.correo.toLowerCase()));
    return activeAssessments.map((assessment) => {
      const correo = buildAdminEmail(String(assessment.id));
      return {
        assessment,
        correo,
        exists: existingEmails.has(correo.toLowerCase()),
      };
    });
  };

  const openBulkAssessmentPreview = () => {
    if (gruposEstudiantiles.length === 0) {
      showToast.error("No hay grupos estudiantiles disponibles.");
      return;
    }
    const payloads = getBulkAssessmentPayloads();
    const items: MassActionItem[] = payloads.map((item) => ({
      key: `${item.grupoEstudiantilId}-${item.nombre}`,
      title: item.nombre,
      subtitle: gruposEstudiantiles.find((g) => g.id === item.grupoEstudiantilId)?.nombre ?? "",
      status: item.exists ? "omitir" : "crear",
    }));
    setMassAction({
      title: "Crear assessments para todos los grupos",
      description: "Se omitirán los assessments que ya existan.",
      items,
      onConfirm: () => {
        setMassAction(null);
        handleCreateAssessmentsForAllGroups(payloads);
      },
    });
  };

  const openBulkAdminPreview = () => {
    if (activeAssessments.length === 0) {
      showToast.error("No hay assessments activos.");
      return;
    }
    const payloads = getBulkAdminPayloads();
    const items: MassActionItem[] = payloads.map((item) => ({
      key: `${item.assessment.id}-${item.correo}`,
      title: item.correo,
      subtitle: item.assessment.nombre,
      status: item.exists ? "omitir" : "crear",
    }));
    setMassAction({
      title: "Crear admins para assessments activos",
      description: "Se omitirán los admins ya existentes.",
      items,
      onConfirm: () => {
        setMassAction(null);
        handleCreateAdminsForAllAssessments(payloads);
      },
    });
  };

  const handleCreateAssessmentsForAllGroups = async (
    payloads: { nombre: string; grupoEstudiantilId: number; exists: boolean }[]
  ) => {
    setCreatingBulkAssessments(true);
    try {
      const response = await authFetch(
        "/api/assessment/bulk-create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            grupoIds: payloads.map((item) => item.grupoEstudiantilId),
            activo: assessmentActivo,
          }),
        },
        () => logout()
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Error al crear assessments");
      }

      const created = result.created || [];
      const skipped = result.skipped || [];

      if (created.length > 0) {
        setAssessments((prev) => {
          const normalized = assessmentActivo
            ? prev.map((item) =>
                created.some((createdItem: { grupoId: number }) => createdItem.grupoId === item.grupoId)
                  ? { ...item, activo: false }
                  : item
              )
            : prev;
          return [
            ...normalized,
            ...created.map((item: { id: number; nombre: string; grupoId: number; activo: boolean }) => ({
              id: item.id,
              nombre: item.nombre,
              descripcion: "",
              activo: item.activo,
              grupoId: item.grupoId,
              grupoNombre: gruposEstudiantiles.find((g) => g.id === item.grupoId)?.nombre ?? null,
            })),
          ];
        });
        showToast.success(`Assessments creados: ${created.length}`);
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


  const handleCreateAdminsForAllAssessments = async (
    payloads: { assessment: Assessment; correo: string; exists: boolean }[]
  ) => {
    setCreatingBulkAdmins(true);
    try {
      const response = await authFetch(
        "/api/staff/bulk-create-admins",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ assessmentIds: payloads.map((item) => item.assessment.id) }),
        },
        () => logout()
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Error al crear admins");
      }

      const created = result.created || [];
      const skipped = result.skipped || [];

      if (created.length > 0) {
        showToast.success(`Admins creados: ${created.length}`);
        setAdmins((prev) => [
          ...prev,
          ...created.map((item: AdminUser & { password?: string | null }) => ({
            id: item.id,
            correo: item.correo,
            assessmentId: item.assessmentId,
            assessmentNombre: item.assessmentNombre,
            grupoNombre: item.grupoNombre,
          })),
        ]);
        setAdminEdits((prev) => {
          const next = { ...prev };
          created.forEach((item: AdminUser) => {
            next[item.id] = {
              correo: item.correo,
              password: "",
            };
          });
          return next;
        });

        const csvRows = created.map(
          (item: AdminUser & { password?: string | null }) => ({
            Assessment: item.assessmentNombre ?? "",
            Correo: item.correo,
            Contrasena: item.password ?? "",
          })
        );
        if (csvRows.length > 0) {
          const csv = stringify(csvRows, {
            header: true,
            columns: Object.keys(csvRows[0] ?? {}),
            delimiter: ";",
          });
          const bom = "\uFEFF";
          const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
          const fecha = new Date().toISOString().split("T")[0];
          saveAs(blob, `admins_${fecha}.csv`);
        }
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
        prev.map((assessment) => {
          const nextGroupId = edit.grupoId ? Number(edit.grupoId) : null;
          if (assessment.id === assessmentId) {
            return {
              ...assessment,
              descripcion: edit.descripcion,
              activo: edit.activo,
              grupoId: nextGroupId,
              grupoNombre:
                gruposEstudiantiles.find((group) => String(group.id) === edit.grupoId)?.nombre ?? null,
            };
          }
          if (edit.activo && nextGroupId != null && assessment.grupoId === nextGroupId) {
            return { ...assessment, activo: false };
          }
          return assessment;
        })
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

  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesStatus =
        assessmentFilter === "todos" ||
        (assessmentFilter === "activos" && assessment.activo) ||
        (assessmentFilter === "inactivos" && !assessment.activo);
      const matchesSearch =
        assessmentSearch.trim().length === 0 ||
        assessment.nombre.toLowerCase().includes(assessmentSearch.toLowerCase());
      const matchesGroup =
        assessmentGroupFilter === "todos" ||
        String(assessment.grupoId ?? "") === assessmentGroupFilter;
      const matchesYear =
        assessmentYearFilter === "todos" ||
        assessment.nombre.toLowerCase().includes(assessmentYearFilter.toLowerCase());
      return matchesStatus && matchesSearch && matchesGroup && matchesYear;
    });
  }, [assessments, assessmentFilter, assessmentSearch, assessmentGroupFilter, assessmentYearFilter]);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const assessment = assessments.find((item) => item.id === admin.assessmentId);
      const isActiveAssessment = assessment?.activo ?? false;
      const matchesStatus = adminFilter === "todos" || (adminFilter === "activos" && isActiveAssessment);
      const matchesSearch =
        adminSearch.trim().length === 0 ||
        admin.correo.toLowerCase().includes(adminSearch.toLowerCase()) ||
        (admin.assessmentNombre ?? "").toLowerCase().includes(adminSearch.toLowerCase());
      const matchesGroup =
        adminGroupFilter === "todos" || String(assessment?.grupoId ?? "") === adminGroupFilter;
      const matchesYear =
        adminYearFilter === "todos" ||
        (admin.assessmentNombre ?? "").toLowerCase().includes(adminYearFilter.toLowerCase());
      return matchesStatus && matchesSearch && matchesGroup && matchesYear;
    });
  }, [admins, assessments, adminFilter, adminSearch, adminGroupFilter, adminYearFilter]);

  if (authLoading || !isSuperAdmin) {
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
        </div>
        <button
          onClick={logout}
          className="bg-error hover:bg-error-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          Cerrar Sesión
        </button>
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
              onClick={openBulkAssessmentPreview}
              disabled={creatingBulkAssessments}
              className="w-full bg-white border-2 border-[color:var(--color-accent)] text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60"
            >
              {creatingBulkAssessments ? "Creando en todos..." : "Crear assessment para todos los grupos"}
            </button>
            <button
              type="button"
              onClick={openBulkAdminPreview}
              disabled={creatingBulkAdmins}
              className="w-full bg-white border-2 border-success text-success hover:bg-success hover:text-white py-2 rounded-lg text-sm font-semibold transition disabled:opacity-60"
            >
              {creatingBulkAdmins ? "Creando admins..." : "Crear admin para assessments activos"}
            </button>
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Buscar assessment..."
              value={assessmentSearch}
              onChange={(e) => setAssessmentSearch(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            />
            <select
              value={assessmentFilter}
              onChange={(e) => setAssessmentFilter(e.target.value as "activos" | "inactivos" | "todos")}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            >
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
              <option value="todos">Todos</option>
            </select>
            <select
              value={assessmentGroupFilter}
              onChange={(e) => setAssessmentGroupFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            >
              <option value="todos">Todos los grupos</option>
              {gruposEstudiantiles.map((grupo) => (
                <option key={grupo.id} value={String(grupo.id)}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Año (ej: 2026)"
              value={assessmentYearFilter === "todos" ? "" : assessmentYearFilter}
              onChange={(e) => setAssessmentYearFilter(e.target.value.trim() || "todos")}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            />
          </div>
          <div className="space-y-4">
            {filteredAssessments.map((assessment) => {
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
            {filteredAssessments.length === 0 && (
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Buscar admin o assessment..."
              value={adminSearch}
              onChange={(e) => setAdminSearch(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            />
            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value as "activos" | "todos")}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            >
              <option value="activos">Solo de assessments activos</option>
              <option value="todos">Todos</option>
            </select>
            <select
              value={adminGroupFilter}
              onChange={(e) => setAdminGroupFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            >
              <option value="todos">Todos los grupos</option>
              {gruposEstudiantiles.map((grupo) => (
                <option key={grupo.id} value={String(grupo.id)}>
                  {grupo.nombre}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Año (ej: 2026)"
              value={adminYearFilter === "todos" ? "" : adminYearFilter}
              onChange={(e) => setAdminYearFilter(e.target.value.trim() || "todos")}
              className="px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm"
            />
          </div>

          {loadingAdmins ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Spinner size="sm" color="custom" customColor="var(--color-accent)" />
              Cargando admins...
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAdmins.map((admin) => {
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
                      <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 text-sm">
                        {admin.assessmentNombre || "Assessment"} · {admin.grupoNombre || "Grupo"}
                      </div>
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
              {filteredAdmins.length === 0 && (
                <p className="text-sm text-gray-500">No hay administradores registrados.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {massAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{massAction.title}</h3>
                <p className="text-sm text-gray-500">{massAction.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setMassAction(null)}
                className="text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto border border-gray-100 rounded-xl">
              {massAction.items.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 px-4 py-2 border-b border-gray-100 text-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    {item.subtitle && <p className="text-xs text-gray-500">{item.subtitle}</p>}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      item.status === "crear"
                        ? "bg-success/15 text-success"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {item.status === "crear" ? "Crear" : "Omitir"}
                  </span>
                </div>
              ))}
              {massAction.items.length === 0 && (
                <div className="p-4 text-sm text-gray-500">No hay elementos para procesar.</div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
              <div className="text-xs text-gray-500">
                Crear: {massAction.items.filter((item) => item.status === "crear").length} · Omitir:{" "}
                {massAction.items.filter((item) => item.status === "omitir").length}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setMassAction(null)}
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={massAction.onConfirm}
                  className="px-4 py-2 rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-sm font-semibold"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
