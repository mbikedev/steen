import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials are not configured');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function sanitizeGridPayload(input: any) {
  const rowNumber = Number(input.row_number);
  const columnNumber = Number(input.column_number);

  return {
    row_number: Number.isFinite(rowNumber) ? rowNumber : input.row_number,
    column_number: Number.isFinite(columnNumber) ? columnNumber : input.column_number,
    resident_name: typeof input.resident_name === 'string' ? input.resident_name.trim() : '',
    color_status: input.color_status ?? null,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('toewijzingen_grid')
      .select('*')
      .order('row_number, column_number');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch grid data' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error fetching grid data:', error);
    return NextResponse.json({ error: 'Failed to fetch grid data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = sanitizeGridPayload(await request.json());
    const supabase = getSupabaseClient();

    let { data, error } = await supabase
      .from('toewijzingen_grid')
      .upsert(payload)
      .select()
      .single();

    if (error && error.message?.includes('color_status')) {
      const fallback = { ...payload };
      delete (fallback as any).color_status;
      const result = await supabase
        .from('toewijzingen_grid')
        .upsert(fallback)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save grid data' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error saving grid data:', error);
    return NextResponse.json({ error: 'Failed to save grid data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = sanitizeGridPayload(await request.json());
    const supabase = getSupabaseClient();

    let { data, error } = await supabase
      .from('toewijzingen_grid')
      .upsert(payload)
      .select()
      .single();

    if (error && error.message?.includes('color_status')) {
      const fallback = { ...payload };
      delete (fallback as any).color_status;
      const result = await supabase
        .from('toewijzingen_grid')
        .upsert(fallback)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update grid data' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating grid data:', error);
    return NextResponse.json({ error: 'Failed to update grid data' }, { status: 500 });
  }
}
