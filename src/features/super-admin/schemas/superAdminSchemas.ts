import { z } from 'zod';

export const GrupoEstudiantilSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
});

export const AssessmentSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  activo: z.boolean(),
  grupoId: z.number().nullable(),
  grupoNombre: z.string().nullable(),
});

export const AdminUserSchema = z.object({
  id: z.number(),
  correo: z.string().email(),
  assessmentId: z.number(),
  assessmentNombre: z.string().nullable(),
  grupoNombre: z.string().nullable(),
});

export const MassActionItemSchema = z.object({
  key: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  status: z.enum(['crear', 'omitir']),
});

export const SuperAdminPanelDataSchema = z.object({
  groups: z.array(GrupoEstudiantilSchema),
  assessments: z.array(AssessmentSchema),
  admins: z.array(AdminUserSchema),
});

export type GrupoEstudiantil = z.infer<typeof GrupoEstudiantilSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
export type MassActionItem = z.infer<typeof MassActionItemSchema>;
export type SuperAdminPanelData = z.infer<typeof SuperAdminPanelDataSchema>;
