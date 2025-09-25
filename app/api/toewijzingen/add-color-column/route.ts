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
    
    // First, check if the column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('toewijzingen_grid')
      .select('color_status')
      .limit(1);

    if (!testError) {
      return NextResponse.json({ 
        success: true, 
        message: 'Color status column already exists' 
      });
    }

    // If the column doesn't exist, we'll get an error. Since we can't use ALTER TABLE with anon key,
    // we'll return instructions for manual setup
    return NextResponse.json({ 
      success: false,
      message: 'Color status column needs to be added manually',
      suggestion: "Please run this SQL in your Supabase dashboard: ALTER TABLE toewijzingen_grid ADD COLUMN IF NOT EXISTS color_status TEXT CHECK (color_status IN ('red', 'blue', 'gray') OR color_status IS NULL);",
      needsManualSetup: true
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ 
      error: 'Failed to check color column',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}