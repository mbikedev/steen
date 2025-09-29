import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST() {
  try {
    const supabase = createClient() as any

    console.log('🔧 Starting general_documents table migration...')

    // Check if table exists by trying to query it
    const { error: tableCheckError } = await supabase
      .from('general_documents')
      .select('id')
      .limit(1)

    if (tableCheckError) {
      // Table doesn't exist, provide SQL to create it
      return NextResponse.json({
        success: false,
        needsManualSetup: true,
        message: 'The general_documents table needs to be created. Please run the provided SQL in your Supabase SQL Editor.',
        sql: `
-- Create general_documents table for documents not tied to specific residents
CREATE TABLE IF NOT EXISTS general_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  category TEXT, -- For categorization (e.g., 'policy', 'safety', 'notice', 'form')
  tags TEXT[], -- Array of tags for better filtering
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true, -- For soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_general_documents_category ON general_documents(category);
CREATE INDEX idx_general_documents_is_active ON general_documents(is_active);
CREATE INDEX idx_general_documents_created_at ON general_documents(created_at DESC);
CREATE INDEX idx_general_documents_tags ON general_documents USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE general_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all authenticated users to read active documents
CREATE POLICY "Allow read access for authenticated users"
ON general_documents
FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Allow service role full access (for backend operations)
CREATE POLICY "Service role has full access"
ON general_documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_general_documents_updated_at
BEFORE UPDATE ON general_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create view for easier access with user info
CREATE OR REPLACE VIEW general_documents_with_user AS
SELECT
    gd.*,
    au.email as uploaded_by_email
FROM general_documents gd
LEFT JOIN auth.users au ON gd.uploaded_by = au.id;

-- Grant access to the view
GRANT SELECT ON general_documents_with_user TO authenticated;
        `
      })
    }

    console.log('✅ general_documents table exists!')

    // Now perform initial sync from storage
    console.log('🔄 Starting initial sync from storage...')

    const { apiService } = await import('@/lib/api-service')
    const syncResult = await apiService.syncStorageToGeneralDocuments()

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      syncResult: {
        synced: syncResult.synced,
        skipped: syncResult.skipped,
        errors: syncResult.errors
      }
    })

  } catch (error) {
    console.error('❌ Error in migration:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during migration'
    }, { status: 500 })
  }
}
