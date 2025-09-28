import { NextRequest, NextResponse } from 'next/server'
import { apiService } from '@/lib/api-service'

export async function GET() {
  try {
    console.log('🧪 Testing smart sync functionality...')

    // Run the smart sync for IN documents
    const result = await apiService.smartSyncAllDocuments('IN')

    return NextResponse.json({
      success: true,
      message: 'Smart sync completed successfully',
      result: result,
      summary: {
        generalDocuments: `${result.generalSync?.synced || 0}/${result.generalSync?.total || 0}`,
        residentDocuments: result.storageSync.syncedDocs,
        orphansRecovered: result.orphanRecovery.recovered,
        orphansUpdated: result.orphanRecovery.updated,
        errors: [
          ...(result.generalSync?.errors || []),
          ...result.orphanRecovery.errors
        ]
      }
    })

  } catch (error) {
    console.error('❌ Error in test sync:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during test sync'
    }, { status: 500 })
  }
}
