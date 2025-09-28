import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET() {
  try {
    const supabase = createClient() as any

    // Check for duplicates
    const { data: duplicates, error: checkError } = await supabase
      .from('administrative_documents')
      .select('file_name, document_type, resident_id')
      .order('file_name')

    if (checkError) {
      return NextResponse.json({
        success: false,
        error: `Failed to check duplicates: ${checkError.message}`
      }, { status: 500 })
    }

    // Group by file_name, document_type, resident_id to find duplicates
    const duplicateGroups = new Map<string, any[]>()

    duplicates?.forEach((doc: any) => {
      const key = `${doc.file_name}::${doc.document_type}::${doc.resident_id || 'NULL'}`
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, [])
      }
      duplicateGroups.get(key)!.push(doc)
    })

    const duplicateCount = Array.from(duplicateGroups.values())
      .filter(group => group.length > 1)
      .reduce((sum, group) => sum + (group.length - 1), 0)

    return NextResponse.json({
      success: true,
      totalDocuments: duplicates?.length || 0,
      duplicateCount,
      duplicateGroups: Array.from(duplicateGroups.entries())
        .filter(([_, group]) => group.length > 1)
        .map(([key, group]) => ({
          key,
          count: group.length,
          documents: group
        }))
    })

  } catch (error) {
    console.error('Error checking duplicates:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const supabase = createClient() as any

    console.log('🧹 Starting duplicate cleanup...')

    // Get all documents
    const { data: allDocs, error: fetchError } = await supabase
      .from('administrative_documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      throw fetchError
    }

    // Group duplicates
    const groups = new Map<string, any[]>()

    allDocs?.forEach((doc: any) => {
      const key = `${doc.file_name}::${doc.document_type}::${doc.resident_id || 'NULL'}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(doc)
    })

    // Process each duplicate group
    let deletedCount = 0
    const deletedIds: string[] = []

    for (const [key, docs] of groups.entries()) {
      if (docs.length > 1) {
        // Sort by created_at descending (keep the newest)
        docs.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        // Keep the first (newest), delete the rest
        const toDelete = docs.slice(1)

        for (const doc of toDelete) {
          const { error: deleteError } = await supabase
            .from('administrative_documents')
            .delete()
            .eq('id', doc.id)

          if (deleteError) {
            console.error(`Failed to delete duplicate ${doc.id}:`, deleteError)
          } else {
            deletedCount++
            deletedIds.push(doc.id)
            console.log(`Deleted duplicate: ${doc.file_name} (ID: ${doc.id})`)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleaned up ${deletedCount} duplicate documents`,
      deletedCount,
      deletedIds
    })

  } catch (error) {
    console.error('Error during cleanup:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during cleanup'
    }, { status: 500 })
  }
}
