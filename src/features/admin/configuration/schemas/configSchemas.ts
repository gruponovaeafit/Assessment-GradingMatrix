import { z } from 'zod';

export const CalificacionSchema = z.object({
  ID: z.number(),
  Grupo: z.string(),
  Participante: z.string(),
  Correo: z.string().email(),
  role: z.string(),
  Calificacion_Promedio: z.number().nullable(),
  Estado: z.string(),
  Active: z.boolean().optional(),
});

export const AssessmentSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  activo: z.boolean(),
});

export const ParticipantSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  correo: z.string().email(),
});

export const GroupSchema = z.object({
  id: z.number(),
  nombre: z.string(),
});

export const BaseSchema = z.object({
  ID_Base: z.number(),
  Numero_Base: z.number(),
  Nombre_Base: z.string(),
});

export type Calificacion = z.infer<typeof CalificacionSchema>;
export type Assessment = z.infer<typeof AssessmentSchema>;
export type Participant = z.infer<typeof ParticipantSchema>;
export type Group = z.infer<typeof GroupSchema>;
export type Base = z.infer<typeof BaseSchema>;
