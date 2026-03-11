import { z } from 'zod';

export const BaseResumenSchema = z.object({
  numero: z.number(),
  promedio: z.number().nullable(),
});

export const ParticipantDashboardRowSchema = z.object({
  ID: z.number(),
  Grupo: z.string(),
  Participante: z.string(),
  Correo: z.string().email(),
  role: z.string(),
  Foto: z.string().nullable().optional(),
  Calificacion_Promedio: z.number().nullable(),
  Estado: z.string(),
  Bases: z.array(BaseResumenSchema),
});

export const AssessmentSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  activo: z.boolean(),
});

export type BaseResumen = z.infer<typeof BaseResumenSchema>;
export type ParticipantDashboardRow = z.infer<typeof ParticipantDashboardRowSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;

export interface ClassificationRanges {
  group: number;
  interview: number;
  discussion: number;
}
