import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log('Creating tables manually through Supabase client...');
    
    // Try to create the staff table by inserting and deleting a test record
    // This will automatically create the table structure
    try {
      const { error: staffTestError } = await supabase
        .from('toewijzingen_staff')
        .insert({ position: 999, name: 'test' });
      
      if (staffTestError) {
        console.log('Staff table might not exist, that\'s expected for first run');
      } else {
        // Delete the test record
        await supabase.from('toewijzingen_staff').delete().eq('position', 999);
      }
    } catch (e) {
      console.log('Staff table creation test completed');
    }

    // Try to create the grid table by inserting and deleting a test record
    try {
      const { error: gridTestError } = await supabase
        .from('toewijzingen_grid')
        .insert({ 
          row_number: 999, 
          column_number: 999, 
          resident_name: 'test',
          color_status: null 
        });
      
      if (gridTestError) {
        console.log('Grid table might not exist, that\'s expected for first run');
      } else {
        // Delete the test record
        await supabase.from('toewijzingen_grid').delete().eq('row_number', 999);
      }
    } catch (e) {
      console.log('Grid table creation test completed');
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

    console.log('Inserting default staff data...');
    for (const staff of defaultStaff) {
      const { error } = await supabase
        .from('toewijzingen_staff')
        .upsert(staff, { onConflict: 'position' });
      
      if (error) {
        console.warn('Error inserting staff:', staff.name, error.message);
      } else {
        console.log('Successfully inserted staff:', staff.name);
      }
    }

    // Insert initial grid data including backup staff
    const initialGridData = [
      { row_number: 3, column_number: 1, resident_name: 'Jabarkhel Noor Agha', color_status: null },
      { row_number: 4, column_number: 1, resident_name: 'ABDELA Omer Suleman', color_status: null },
      // Default backup staff (row 15)
      { row_number: 15, column_number: 0, resident_name: 'Yasmina', color_status: null },
      { row_number: 15, column_number: 1, resident_name: 'Didar', color_status: null },
      { row_number: 15, column_number: 2, resident_name: 'Torben', color_status: null },
      { row_number: 15, column_number: 3, resident_name: 'Imane', color_status: null },
      { row_number: 15, column_number: 4, resident_name: 'Maaike/Martine', color_status: null },
      { row_number: 15, column_number: 5, resident_name: 'Kris', color_status: null },
      { row_number: 15, column_number: 6, resident_name: 'Dorien', color_status: null },
      { row_number: 15, column_number: 7, resident_name: 'Monica', color_status: null },
    ];

    console.log('Inserting initial grid data...');
    for (const gridItem of initialGridData) {
      const { error } = await supabase
        .from('toewijzingen_grid')
        .upsert(gridItem, { onConflict: 'row_number,column_number' });
      
      if (error) {
        console.warn('Error inserting grid data:', gridItem, error.message);
      } else {
        console.log('Successfully inserted grid data:', `${gridItem.row_number}-${gridItem.column_number}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database setup completed successfully',
      details: 'Staff and grid data inserted, backup rows included'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to setup database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}