import { z } from 'zod';

export const participantSchema = z.object({
  ID: z.number(),
  Nombre: z.string().or(z.any()), // Can be ReactNode in some cases but usually string from API
  ID_Persona: z.number(),
  Grupo: z.string(),
  role: z.string(),
  Photo: z.string().optional(),
});

export type Participant = z.infer<typeof participantSchema>;

export const baseDataSchema = z.object({
  Nombre: z.string(),
  Competencia: z.string(),
  Descripcion: z.string(),
  Comportamiento1: z.string(),
  Comportamiento2: z.string(),
  Comportamiento3: z.string(),
  id_Calificador: z.number().optional(),
});

export type BaseData = z.infer<typeof baseDataSchema>;

export const groupSchema = z.object({
  id: z.number(),
  nombre: z.string(),
});

export type Group = z.infer<typeof groupSchema>;

export const calificacionKeySchema = z.enum(['Calificacion_1', 'Calificacion_2', 'Calificacion_3']);
export type CalificacionKey = z.infer<typeof calificacionKeySchema>;

export const singleCalificacionSchema = z.record(calificacionKeySchema, z.union([z.number(), z.literal('')]));

export const calificacionesSchema = z.record(z.number(), singleCalificacionSchema);
export type CalificacionesType = z.infer<typeof calificacionesSchema>;
