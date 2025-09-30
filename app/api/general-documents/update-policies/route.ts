import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'Please run the following SQL in your Supabase SQL Editor to update the RLS policies',
    sql: `
-- Drop existing policies
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON general_documents;
DROP POLICY IF EXISTS "Service role has full access" ON general_documents;

-- Recreate policies with proper permissions

-- Policy: Allow all authenticated users to read active documents
CREATE POLICY "Allow read access for authenticated users"
ON general_documents
FOR SELECT
TO authenticated
USING (is_active = true);

-- Policy: Allow anon users to read active documents (for public access)
CREATE POLICY "Allow read access for anon users"
ON general_documents
FOR SELECT
TO anon
USING (is_active = true);

-- Policy: Allow inserts from authenticated users
CREATE POLICY "Allow insert for authenticated users"
ON general_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow inserts from anon role (for API operations)
CREATE POLICY "Allow insert for anon role"
ON general_documents
FOR INSERT
TO anon
WITH CHECK (true);

-- Policy: Allow updates from authenticated users
CREATE POLICY "Allow update for authenticated users"
ON general_documents
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow updates from anon role (for API operations)
CREATE POLICY "Allow update for anon role"
ON general_documents
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Policy: Allow service role full access (for backend operations)
CREATE POLICY "Service role has full access"
ON general_documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'general_documents'
ORDER BY policyname;
    `
  })
}
