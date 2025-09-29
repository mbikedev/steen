import { NextRequest, NextResponse } from 'next/server'
import { apiService } from '@/lib/api-service'

export async function POST(request: NextRequest) {
  try {
    const { documentType = 'IN' } = await request.json()
    
    // Validate document type
    if (!['IN', 'OUT'].includes(documentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document type. Must be IN or OUT.' },
        { status: 400 }
      )
    }

    console.log(`🚀 API: Starting smart sync for ${documentType} documents`)
    
    // Run the smart sync
    const result = await apiService.smartSyncAllDocuments(documentType as 'IN' | 'OUT')
    
    console.log(`✅ API: Smart sync completed for ${documentType}:`, result)
    
    return NextResponse.json({
      success: true,
      result,
      message: `Smart sync completed for ${documentType} documents`
    })
    
  } catch (error) {
    console.error('API Error in smart sync:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during smart sync'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for orphan recovery only
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('type') as 'IN' | 'OUT' || 'IN'
    
    // Validate document type
    if (!['IN', 'OUT'].includes(documentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document type. Must be IN or OUT.' },
        { status: 400 }
      )
    }

    console.log(`🔄 API: Starting orphan recovery for ${documentType} documents`)
    
    // Run orphan recovery only
    const result = await apiService.recoverOrphanedDocuments(documentType)
    
    console.log(`✅ API: Orphan recovery completed for ${documentType}:`, result)
    
    return NextResponse.json({
      success: true,
      result,
      message: `Orphan recovery completed for ${documentType} documents`
    })
    
  } catch (error) {
    console.error('API Error in orphan recovery:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during orphan recovery'
      },
      { status: 500 }
    )
  }
}