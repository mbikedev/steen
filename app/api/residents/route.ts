import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET: Fetch all residents
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: residents, error } = await supabase
      .from('residents')
      .select('*')
      .order('badge', { ascending: true });

    if (error) {
      console.error('Error fetching residents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch residents' },
        { status: 500 }
      );
    }

    return NextResponse.json(residents || []);

  } catch (error) {
    console.error('Error in GET /api/residents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}