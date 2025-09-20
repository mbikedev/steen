import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('toewijzingen_grid')
      .select('*')
      .order('row_number, column_number');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch grid data' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching grid data:', error);
    return NextResponse.json({ error: 'Failed to fetch grid data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { row_number, column_number, resident_name, color_status } = await request.json();
    
    const { data, error } = await supabase
      .from('toewijzingen_grid')
      .upsert({ row_number, column_number, resident_name, color_status })
      .select()
      .single();

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
    const { row_number, column_number, resident_name, color_status } = await request.json();
    
    if (!resident_name || resident_name.trim() === '') {
      // Delete if empty
      const { error } = await supabase
        .from('toewijzingen_grid')
        .delete()
        .eq('row_number', row_number)
        .eq('column_number', column_number);

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ error: 'Failed to delete grid data' }, { status: 500 });
      }

      return NextResponse.json({ deleted: true });
    } else {
      // Update or insert - try with color_status first, fallback without it
      let dataToInsert: any = { row_number, column_number, resident_name };
      
      // Only add color_status if the column exists (check by trying to include it)
      if (color_status !== undefined) {
        dataToInsert.color_status = color_status;
      }
      
      let { data, error } = await supabase
        .from('toewijzingen_grid')
        .upsert(dataToInsert)
        .select()
        .single();

      // If color_status column doesn't exist, retry without it
      if (error && error.message?.includes('color_status')) {
        console.log('Retrying without color_status column...');
        const fallbackData = { row_number, column_number, resident_name };
        const result = await supabase
          .from('toewijzingen_grid')
          .upsert(fallbackData)
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
    }
  } catch (error) {
    console.error('Error updating grid data:', error);
    return NextResponse.json({ error: 'Failed to update grid data' }, { status: 500 });
  }
}