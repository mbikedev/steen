import { NextRequest, NextResponse } from 'next/server';
import {
  fetchYouthOverviewByBadge,
  updateYouthOverviewField,
  updateYouthOverviewRecord,
  deleteYouthOverviewRecord,
  YouthOverviewData
} from '@/lib/supabase/youth-overview-api';

// GET: Fetch a single youth overview record by badge
export async function GET(
  request: NextRequest,
  { params }: { params: { badge: string } }
) {
  try {
    const data = await fetchYouthOverviewByBadge(params.badge);

    if (!data) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`Error in GET /api/youth-overview/${params.badge}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch youth overview record' },
      { status: 500 }
    );
  }
}

// PATCH: Update specific fields of a youth overview record
export async function PATCH(
  request: NextRequest,
  { params }: { params: { badge: string } }
) {
  try {
    const body = await request.json();

    // Check if it's a single field update or multiple fields
    if (body.field && body.value !== undefined) {
      // Single field update
      const success = await updateYouthOverviewField(
        params.badge,
        body.field as keyof YouthOverviewData,
        body.value
      );

      if (success) {
        return NextResponse.json({ success: true, message: 'Field updated successfully' });
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to update field' },
          { status: 500 }
        );
      }
    } else {
      // Multiple fields update
      const success = await updateYouthOverviewRecord(params.badge, body as Partial<YouthOverviewData>);

      if (success) {
        return NextResponse.json({ success: true, message: 'Record updated successfully' });
      } else {
        return NextResponse.json(
          { success: false, error: 'Failed to update record' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error(`Error in PATCH /api/youth-overview/${params.badge}:`, error);
    return NextResponse.json(
      { error: 'Failed to process update request' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a youth overview record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { badge: string } }
) {
  try {
    const success = await deleteYouthOverviewRecord(params.badge);

    if (success) {
      return NextResponse.json({ success: true, message: 'Record deleted successfully' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to delete record' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`Error in DELETE /api/youth-overview/${params.badge}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete record' },
      { status: 500 }
    );
  }
}