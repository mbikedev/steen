import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Test if the table exists and has the correct schema
    const { data, error } = await supabase
      .from('administrative_documents')
      .select('*')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        message: 'Table schema needs to be fixed. Please run the SQL script in Supabase dashboard.'
      })
    }

    // Test if we can insert a test record (and then delete it)
    const testRecord = {
      document_type: 'IN',
      file_name: 'test-schema-check.txt',
      file_path: 'https://example.com/test',
      storage_path: 'test-schema-check',
      description: 'Schema test record',
      file_size: 0,
      mime_type: 'text/plain'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('administrative_documents')
      .insert(testRecord)
      .select()

    if (insertError) {
      return NextResponse.json({ 
        success: false, 
        error: insertError.message,
        message: 'Table schema is incorrect. Please run the SQL script in Supabase dashboard.'
      })
    }

    // Clean up test record
    if (insertData && insertData.length > 0) {
      await supabase
        .from('administrative_documents')
        .delete()
        .eq('id', insertData[0].id)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Table schema is correct! Document uploads should work now.' 
    })

  } catch (error) {
    console.error('Error testing schema:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test schema' 
    }, { status: 500 })
  }
}
