import { useState, useMemo, useEffect } from 'react';
import { type Assessment, type AdminUser } from '../schemas/superAdminSchemas';

export function useSuperAdminFilters(assessments: Assessment[], admins: AdminUser[]) {
  // Assessment filters
  const [assessmentFilter, setAssessmentFilter] = useState<"activos" | "inactivos" | "todos">("activos");
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [assessmentGroupFilter, setAssessmentGroupFilter] = useState<string>("todos");
  const [assessmentYearFilter, setAssessmentYearFilter] = useState<string>("todos");
  const [assessmentPage, setAssessmentPage] = useState(1);
  const [itemsPerAssessmentPage, setItemsPerAssessmentPage] = useState(10);

  // Admin filters
  const [adminFilter, setAdminFilter] = useState<"activos" | "todos">("activos");
  const [adminSearch, setAdminSearch] = useState("");
  const [adminGroupFilter, setAdminGroupFilter] = useState<string>("todos");
  const [adminYearFilter, setAdminYearFilter] = useState<string>("todos");
  const [adminPage, setAdminPage] = useState(1);
  const [itemsPerAdminPage, setItemsPerAdminPage] = useState(10);

  // Derived unique values for filters
  const uniqueGroups = useMemo(() => {
    const groups = new Set<string>();
    assessments.forEach(a => { if (a.grupoNombre) groups.add(a.grupoNombre); });
    return Array.from(groups).sort();
  }, [assessments]);

  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    assessments.forEach(a => {
      const match = a.nombre.match(/\d{4}/);
      if (match) years.add(match[0]);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [assessments]);

  // Assessment filtering logic
  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesStatus =
        assessmentFilter === "todos" ||
        (assessmentFilter === "activos" && assessment.activo) ||
        (assessmentFilter === "inactivos" && !assessment.activo);

      const matchesSearch =
        assessmentSearch === "" ||
        assessment.nombre.toLowerCase().includes(assessmentSearch.toLowerCase()) ||
        (assessment.descripcion || "").toLowerCase().includes(assessmentSearch.toLowerCase());

      const matchesGroup =
        assessmentGroupFilter === "todos" || assessment.grupoNombre === assessmentGroupFilter;

      const matchesYear =
        assessmentYearFilter === "todos" || assessment.nombre.includes(assessmentYearFilter);

      return matchesStatus && matchesSearch && matchesGroup && matchesYear;
    });
  }, [assessments, assessmentFilter, assessmentSearch, assessmentGroupFilter, assessmentYearFilter]);

  // Admin filtering logic
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const assessment = assessments.find((item) => item.id === admin.assessmentId);
      const isActiveAssessment = assessment?.activo ?? false;

      const matchesStatus = 
        adminFilter === "todos" || (adminFilter === "activos" && isActiveAssessment);

      const matchesSearch =
        adminSearch === "" ||
        admin.correo.toLowerCase().includes(adminSearch.toLowerCase()) ||
        (admin.assessmentNombre || "").toLowerCase().includes(adminSearch.toLowerCase());

      const matchesGroup =
        adminGroupFilter === "todos" || admin.grupoNombre === adminGroupFilter;

      const matchesYear =
        adminYearFilter === "todos" || (admin.assessmentNombre || "").includes(adminYearFilter);

      return matchesStatus && matchesSearch && matchesGroup && matchesYear;
    });
  }, [admins, assessments, adminFilter, adminSearch, adminGroupFilter, adminYearFilter]);

  // Pagination
  const paginatedAssessments = useMemo(() => {
    const start = (assessmentPage - 1) * itemsPerAssessmentPage;
    return filteredAssessments.slice(start, start + itemsPerAssessmentPage);
  }, [filteredAssessments, assessmentPage, itemsPerAssessmentPage]);

  const paginatedAdmins = useMemo(() => {
    const start = (adminPage - 1) * itemsPerAdminPage;
    return filteredAdmins.slice(start, start + itemsPerAdminPage);
  }, [filteredAdmins, adminPage, itemsPerAdminPage]);

  const totalAssessmentPages = Math.ceil(filteredAssessments.length / itemsPerAssessmentPage);
  const totalAdminPages = Math.ceil(filteredAdmins.length / itemsPerAdminPage);

  // Reset to first page when filters change
  useEffect(() => setAssessmentPage(1), [assessmentFilter, assessmentSearch, assessmentGroupFilter, assessmentYearFilter]);
  useEffect(() => setAdminPage(1), [adminFilter, adminSearch, adminGroupFilter, adminYearFilter]);

  return {
    // State
    assessmentFilter, setAssessmentFilter,
    assessmentSearch, setAssessmentSearch,
    assessmentGroupFilter, setAssessmentGroupFilter,
    assessmentYearFilter, setAssessmentYearFilter,
    assessmentPage, setAssessmentPage,
    itemsPerAssessmentPage, setItemsPerAssessmentPage,

    adminFilter, setAdminFilter,
    adminSearch, setAdminSearch,
    adminGroupFilter, setAdminGroupFilter,
    adminYearFilter, setAdminYearFilter,
    adminPage, setAdminPage,
    itemsPerAdminPage, setItemsPerAdminPage,

    // Data
    uniqueGroups,
    uniqueYears,
    filteredAssessments,
    filteredAdmins,
    paginatedAssessments,
    paginatedAdmins,
    totalAssessmentPages,
    totalAdminPages
  };
}
