import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

export async function POST() {
  try {
    const supabase = getSupabaseClient();
    console.log('Starting database setup...');
    
    // Test basic connectivity first
    const { data: testData, error: testError } = await supabase.from('toewijzingen_staff').select('count').limit(1);
    if (testError) {
      console.log('Tables may not exist yet, continuing with setup...');
    } else {
      console.log('Database connection successful, tables may already exist');
    }

    // Insert default staff data
    const defaultStaff = [
      { position: 1, name: 'Kris B' },
      { position: 2, name: 'Torben' },
      { position: 3, name: 'Didar' },
      { position: 4, name: 'Dorien' },
      { position: 5, name: 'Evelien' },
      { position: 6, name: 'Yasmina' },
      { position: 7, name: 'Imane' },
      { position: 8, name: 'Kirsten' },
      { position: 9, name: 'Monica' },
    ];

    for (const staff of defaultStaff) {
      const { error } = await supabase
        .from('toewijzingen_staff')
        .upsert(staff);
      
      if (error) {
        console.warn('Error inserting staff:', staff.name, error);
      }
    }

    // Insert initial grid data including backup staff
    const initialGridData = [
      { row_number: 3, column_number: 1, resident_name: 'Jabarkhel Noor Agha' },
      { row_number: 4, column_number: 1, resident_name: 'ABDELA Omer Suleman' },
      // Default backup staff (row 15)
      { row_number: 15, column_number: 1, resident_name: 'Kris B' },
      { row_number: 15, column_number: 2, resident_name: 'Torben' },
      { row_number: 15, column_number: 3, resident_name: 'Didar' },
      { row_number: 15, column_number: 4, resident_name: 'Dorien' },
      { row_number: 15, column_number: 5, resident_name: 'Evelien' },
      { row_number: 15, column_number: 6, resident_name: 'Yasmina' },
      { row_number: 15, column_number: 7, resident_name: 'Imane' },
      { row_number: 15, column_number: 8, resident_name: 'Kirsten' },
      { row_number: 15, column_number: 9, resident_name: 'Monica' },
    ];

    for (const gridItem of initialGridData) {
      const { error } = await supabase
        .from('toewijzingen_grid')
        .upsert(gridItem);
      
      if (error) {
        console.warn('Error inserting grid data:', gridItem, error);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tables created and initialized successfully' 
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup tables',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}