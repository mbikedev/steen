import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Test 1: Check if table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'administrative_documents')
      .order('ordinal_position')

    if (tableError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get table info',
        details: tableError 
      })
    }

    // Test 2: Try to insert a minimal test record
    const testRecord = {
      document_type: 'IN',
      file_name: 'test-schema-check.txt',
      file_path: 'https://example.com/test',
      storage_path: 'test-schema-check',
      description: 'Schema test record',
      file_size: 0,
      mime_type: 'text/plain',
      uploaded_by: null
    }

    const { data: insertData, error: insertError } = await supabase
      .from('administrative_documents')
      .insert(testRecord)
      .select()

    // Clean up test record if it was inserted
    if (insertData && insertData.length > 0) {
      await supabase
        .from('administrative_documents')
        .delete()
        .eq('id', insertData[0].id)
    }

    return NextResponse.json({ 
      success: true,
      tableColumns: tableInfo,
      insertTest: insertError ? { error: insertError } : { success: true },
      message: 'Database schema test completed'
    })

  } catch (error) {
    console.error('Error testing schema:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test schema',
      details: error 
    }, { status: 500 })
  }
}
