import { NextRequest, NextResponse } from 'next/server';
import {
  moveYouthToTab,
  YouthOverviewData
} from '@/lib/supabase/youth-overview-api';

// POST: Move a youth record between IN and OUT tabs
export async function POST(
  request: NextRequest,
  { params }: { params: { badge: string } }
) {
  try {
    const body = await request.json();

    if (!body.tab || (body.tab !== 'IN' && body.tab !== 'OUT')) {
      return NextResponse.json(
        { error: 'Invalid tab. Must be "IN" or "OUT"' },
        { status: 400 }
      );
    }

    const additionalData: Partial<YouthOverviewData> = {};

    // Add any additional fields from the request body
    if (body.datum_transfer) {
      additionalData.datum_transfer = body.datum_transfer;
    }

    if (body.transferdossier_verzonden) {
      additionalData.transferdossier_verzonden = body.transferdossier_verzonden;
    }

    if (body.out_status) {
      additionalData.out_status = body.out_status;
    }

    const success = await moveYouthToTab(params.badge, body.tab, additionalData);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Record moved to ${body.tab} tab successfully`
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to move record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Error in POST /api/youth-overview/${params.badge}/move:`, error);
    return NextResponse.json(
      { error: 'Failed to move record' },
      { status: 500 }
    );
  }
}