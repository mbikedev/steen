import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Create staff table
    const { error: staffTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS toewijzingen_staff (
          id SERIAL PRIMARY KEY,
          position INTEGER UNIQUE NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (staffTableError) {
      console.error('Error creating staff table:', staffTableError);
    }

    // Create grid table
    const { error: gridTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS toewijzingen_grid (
          id SERIAL PRIMARY KEY,
          row_number INTEGER NOT NULL,
          column_number INTEGER NOT NULL,
          resident_name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(row_number, column_number)
        );
      `
    });

    if (gridTableError) {
      console.error('Error creating grid table:', gridTableError);
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

    // Insert initial grid data
    const initialGridData = [
      { row_number: 3, column_number: 1, resident_name: 'Jabarkhel Noor Agha' },
      { row_number: 4, column_number: 1, resident_name: 'ABDELA Omer Suleman' },
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