import { NextRequest, NextResponse } from 'next/server';
import {
  transferResidentDocumentsToOut,
  copyResidentDocumentsToOut,
  getDocumentTransferStatus
} from '@/lib/supabase/document-transfer-api';

// POST: Transfer documents from IN to OUT for a specific resident
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.residentId || !body.residentBadge || !body.residentName) {
      return NextResponse.json(
        { error: 'Missing required fields: residentId, residentBadge, residentName' },
        { status: 400 }
      );
    }

    const { residentId, residentBadge, residentName, transferMethod = 'transfer' } = body;

    console.log(`📂 Starting document ${transferMethod} for resident ${residentBadge}`);

    let result;
    if (transferMethod === 'copy') {
      // Copy documents (keeps originals)
      result = await copyResidentDocumentsToOut(
        parseInt(residentId),
        residentBadge.toString(),
        residentName
      );
    } else {
      // Transfer documents (moves from IN to OUT)
      result = await transferResidentDocumentsToOut(
        parseInt(residentId),
        residentBadge.toString(),
        residentName
      );
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Documents ${transferMethod === 'copy' ? 'copied' : 'transferred'} successfully`,
        transferredCount: result.transferredCount,
        transferredDocuments: result.transferredDocuments,
        errors: result.errors
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Document ${transferMethod} failed`,
          errors: result.errors,
          transferredCount: result.transferredCount
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in document transfer API:', error);
    return NextResponse.json(
      { error: 'Internal server error during document transfer' },
      { status: 500 }
    );
  }
}

// GET: Get document transfer status for a resident
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const residentId = searchParams.get('residentId');

    if (!residentId) {
      return NextResponse.json(
        { error: 'Missing residentId parameter' },
        { status: 400 }
      );
    }

    const status = await getDocumentTransferStatus(parseInt(residentId));

    return NextResponse.json({
      success: true,
      ...status
    });

  } catch (error) {
    console.error('Error getting document transfer status:', error);
    return NextResponse.json(
      { error: 'Failed to get document transfer status' },
      { status: 500 }
    );
  }
}