import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  const { id_base } = await req.json();

  if (!id_base) {
    return NextResponse.json({ error: 'El campo id_base es obligatorio' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('Bases')
      .select(
        'ID_Base, Nombre_Base, Competencia_Base, Descripcion_Base, Comportamiento1_Base, Comportamiento2_Base, Comportamiento3_Base'
      )
      .eq('ID_Base', id_base)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Base no encontrada' }, { status: 404 });
    }

    return NextResponse.json(
      {
        ID_Base: data.ID_Base,
        Nombre: data.Nombre_Base,
        Competencia: data.Competencia_Base,
        Descripcion: data.Descripcion_Base,
        Comportamiento1: data.Comportamiento1_Base,
        Comportamiento2: data.Comportamiento2_Base,
        Comportamiento3: data.Comportamiento3_Base,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error al obtener la base:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
