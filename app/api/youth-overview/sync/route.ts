import { NextRequest, NextResponse } from 'next/server';
import { syncFromResidentsTable } from '@/lib/supabase/youth-overview-api';

// POST: Sync data from residents table to youth_overview table
export async function POST(request: NextRequest) {
  try {
    const success = await syncFromResidentsTable();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Data synced successfully from residents table'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to sync data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST /api/youth-overview/sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync data from residents table' },
      { status: 500 }
    );
  }
}