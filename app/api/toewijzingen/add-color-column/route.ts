import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // Add color_status column to toewijzingen_grid table if it doesn't exist
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE toewijzingen_grid 
        ADD COLUMN IF NOT EXISTS color_status TEXT 
        CHECK (color_status IN ('red', 'blue', 'gray') OR color_status IS NULL);
      `
    });

    if (error) {
      console.error('Error adding color_status column:', error);
      // Try alternative approach - direct update might work even if exec_sql doesn't
      return NextResponse.json({ 
        message: 'Note: Database may need manual update to add color_status column',
        suggestion: "Run this SQL: ALTER TABLE toewijzingen_grid ADD COLUMN IF NOT EXISTS color_status TEXT CHECK (color_status IN ('red', 'blue', 'gray') OR color_status IS NULL);",
        error: error.message 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Color status column added successfully' 
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to add color column',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}