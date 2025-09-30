import { NextRequest, NextResponse } from 'next/server';
import {
  fetchYouthOverviewData,
  batchUpsertYouthOverviewRecords,
  upsertYouthOverviewRecord,
  YouthOverviewData
} from '@/lib/supabase/youth-overview-api';

// GET: Fetch all youth overview records
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tab = searchParams.get('tab') as 'IN' | 'OUT' | null;

    const data = await fetchYouthOverviewData(tab || undefined);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/youth-overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch youth overview data' },
      { status: 500 }
    );
  }
}

// POST: Create or update youth overview records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if it's a batch operation or single record
    if (Array.isArray(body)) {
      // Batch upsert
      const success = await batchUpsertYouthOverviewRecords(body as YouthOverviewData[]);

      if (success) {
        return NextResponse.json({ success: true, message: 'Records upserted successfully' });
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to upsert records' },
          { status: 500 }
        );
      }
    } else {
      // Single upsert
      const success = await upsertYouthOverviewRecord(body as YouthOverviewData);

      if (success) {
        return NextResponse.json({ success: true, message: 'Record upserted successfully' });
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to upsert record' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error in POST /api/youth-overview:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}