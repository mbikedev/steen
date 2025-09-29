import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// GET: Fetch administrative documents for a resident
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const residentId = searchParams.get('resident_id');

    if (!residentId) {
      return NextResponse.json(
        { error: 'Missing resident_id parameter' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: documents, error } = await supabase
      .from('administrative_documents')
      .select('*')
      .eq('resident_id', parseInt(residentId))
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching administrative documents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json(documents || []);

  } catch (error) {
    console.error('Error in GET /api/administrative-documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new administrative document record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.resident_id || !body.file_name || !body.file_path) {
      return NextResponse.json(
        { error: 'Missing required fields: resident_id, file_name, file_path' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: document, error } = await supabase
      .from('administrative_documents')
      .insert([{
        resident_id: body.resident_id,
        document_type: body.document_type || 'IN',
        file_name: body.file_name,
        file_path: body.file_path,
        file_size: body.file_size,
        mime_type: body.mime_type,
        description: body.description,
        uploaded_by: body.uploaded_by,
        resident_badge: body.resident_badge,
        resident_name: body.resident_name,
        storage_path: body.storage_path
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating administrative document:', error);
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Error in POST /api/administrative-documents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}