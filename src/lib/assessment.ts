import { supabase } from '@/lib/supabase/server';

const DEFAULT_ASSESSMENT_ENV = process.env.DEFAULT_ASSESSMENT_ID;

async function fetchFirstAssessmentId(): Promise<number> {
  const { data, error } = await supabase
    .from('Assessment')
    .select('ID_Assessment')
    .order('ID_Assessment', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No se encontró ningún Assessment');
  }

  return data.ID_Assessment;
}

export async function getDefaultAssessmentId(): Promise<number> {
  if (DEFAULT_ASSESSMENT_ENV) {
    const parsed = Number(DEFAULT_ASSESSMENT_ENV);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const { data, error } = await supabase
    .from('Assessment')
    .select('ID_Assessment')
    .eq('Activo_Assessment', true)
    .order('ID_Assessment', { ascending: true })
    .limit(1)
    .single();

  if (data && !error) {
    return data.ID_Assessment;
  }

  return fetchFirstAssessmentId();
}

// Función para resolver el ID del Assessment a partir de un string (por ejemplo, de una query)
export async function resolveAssessmentId(data: string | string[] | undefined): Promise<{ id: number } | { error: string; status: number }> {
  if (!data || Array.isArray(data)) {
    return { error: 'AssessmentId is required', status: 400 };
  }

  const parsed = Number(data);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { error: 'AssessmentId must be a positive integer', status: 400 };
  }

  const { data: assessmentData, error } = await supabase
    .from('Assessment')
    .select('ID_Assessment')
    .eq('ID_Assessment', parsed)
    .single();

  if (error || !assessmentData) {
    return { error: 'Assessment not found', status: 404 };
  }

  return { id: assessmentData.ID_Assessment };
}

// Función para obtener el ID del Assessment asociado a un Staff específico
export async function getAssessmentIdForStaff(staffId: number): Promise<{ id: number } | { error: string; status: number }> {
  const { data, error } = await supabase
    .from('Staff')
    .select('ID_Assessment')
    .eq('ID_Staff', staffId)
    .single();

  if (error || !data) {
    return { error: 'Staff not found', status: 404 };
  }

  return { id: data.ID_Assessment };
}

// Función para obtener el ID del Assessment asociado a un Participante específico
export async function getAssessmentIdForParticipant(participantId: number): Promise<{ id: number } | { error: string; status: number }> {
  const { data, error } = await supabase
    .from('Participante')
    .select('ID_Assessment')
    .eq('ID_Participante', participantId)
    .single();

  if (error || !data) {
    return { error: 'Participant not found', status: 404 };
  }

  return { id: data.ID_Assessment };
}