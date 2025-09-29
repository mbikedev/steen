# Database Schema Fix Guide

## Problem
The `administrative_documents` table has incorrect schema causing:
1. `COALESCE types bigint and uuid cannot be matched` error
2. `column administrative_documents.storage_path does not exist` error

## Solution
You need to recreate the `administrative_documents` table with the correct schema.

## Steps to Fix

### 1. Go to Supabase Dashboard
1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Click "New Query"

### 2. Run the SQL Script
Copy and paste the following SQL script into the SQL Editor and execute it:

```sql
-- First, drop the existing table if it exists (this will remove all data)
DROP TABLE IF EXISTS administrative_documents CASCADE;

-- Create the administrative_documents table with correct schema
CREATE TABLE administrative_documents (
  id BIGSERIAL PRIMARY KEY,
  resident_id BIGINT REFERENCES residents(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('IN', 'OUT')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  storage_path TEXT, -- Add storage_path column for duplicate prevention
  file_size BIGINT,
  mime_type TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resident_badge TEXT, -- Add resident_badge column for enhanced functionality
  resident_name TEXT, -- Add resident_name column for enhanced functionality
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_administrative_documents_resident_id ON administrative_documents(resident_id);
CREATE INDEX idx_administrative_documents_document_type ON administrative_documents(document_type);
CREATE INDEX idx_administrative_documents_uploaded_by ON administrative_documents(uploaded_by);
CREATE INDEX idx_administrative_documents_created_at ON administrative_documents(created_at DESC);
CREATE INDEX idx_administrative_documents_storage_path ON administrative_documents(storage_path);
CREATE INDEX idx_administrative_documents_resident_badge ON administrative_documents(resident_badge);
CREATE INDEX idx_administrative_documents_resident_name ON administrative_documents(resident_name);

-- Enable Row Level Security
ALTER TABLE administrative_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow authenticated users to read documents
CREATE POLICY "Allow read access for authenticated users"
ON administrative_documents
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert documents
CREATE POLICY "Allow insert for authenticated users"
ON administrative_documents
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update their own documents
CREATE POLICY "Allow update for authenticated users"
ON administrative_documents
FOR UPDATE
TO authenticated
USING (uploaded_by = auth.uid())
WITH CHECK (uploaded_by = auth.uid());

-- Allow authenticated users to delete their own documents
CREATE POLICY "Allow delete for authenticated users"
ON administrative_documents
FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

-- Allow service_role full access
CREATE POLICY "Service role has full access"
ON administrative_documents
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
CREATE TRIGGER update_administrative_documents_updated_at
BEFORE UPDATE ON administrative_documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

### 3. Verify the Fix
After running the SQL script:
1. Go to the Table Editor in Supabase
2. Find the `administrative_documents` table
3. Verify it has all the required columns:
   - `id` (bigserial)
   - `resident_id` (bigint)
   - `document_type` (text)
   - `file_name` (text)
   - `file_path` (text)
   - `storage_path` (text)
   - `file_size` (bigint)
   - `mime_type` (text)
   - `description` (text)
   - `uploaded_by` (uuid)
   - `resident_badge` (text)
   - `resident_name` (text)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

### 4. Test Document Upload
1. Go back to your application
2. Try uploading an administrative document
3. The upload should now work without errors

## Important Notes
- **This will delete all existing data** in the `administrative_documents` table
- Make sure to backup any important data before running this script
- The script creates the table with proper foreign key relationships and RLS policies
- All indexes are created for optimal performance

## What This Fixes
1. **COALESCE Error**: The table now has proper data types for `resident_id` (BIGINT) and `uploaded_by` (UUID)
2. **Missing Column Error**: The `storage_path` column is now included
3. **Enhanced Functionality**: Added `resident_badge` and `resident_name` columns for better data management
4. **Security**: Proper RLS policies are in place
5. **Performance**: Indexes are created for better query performance
