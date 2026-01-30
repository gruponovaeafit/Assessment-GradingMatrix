import { supabase } from '@/lib/supabaseServer';

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
