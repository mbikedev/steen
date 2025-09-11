# Supabase Storage Bucket Setup

## Problem
You're getting a "Bucket not found" error when trying to open PDF documents. This is because the required Supabase storage bucket hasn't been created yet.

## Solution

### Step 1: Create the Storage Bucket

1. **Go to your Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project

2. **Navigate to Storage**
   - Click on "Storage" in the left sidebar

3. **Create New Bucket**
   - Click "New bucket" button
   - Enter bucket name: `administrative-documents`
   - Settings:
     - **Public bucket**: Yes (enable this if you want documents to be accessible via direct URLs)
     - **File size limit**: 50MB (or your preferred limit)
     - **Allowed MIME types**: Leave empty to allow all types, or specify:
       ```
       image/*
       application/pdf
       application/msword
       application/vnd.openxmlformats-officedocument.wordprocessingml.document
       ```

4. **Click "Create bucket"**

### Step 2: Set Bucket Policies (Optional)

If you want to restrict access:

1. Go to the bucket settings
2. Click on "Policies"
3. Add appropriate RLS policies for:
   - SELECT (viewing/downloading files)
   - INSERT (uploading files)
   - DELETE (removing files)

Example policy for authenticated users only:
```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'administrative-documents');

-- Allow authenticated users to view files
CREATE POLICY "Allow authenticated downloads" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'administrative-documents');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'administrative-documents');
```

### Step 3: Test the Setup

1. Try uploading a document through the Administrative Documents modal
2. Try viewing an uploaded document
3. Check if the document opens correctly in a new tab

## Alternative: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Create bucket via CLI
supabase storage create administrative-documents --public

# Set CORS if needed
supabase storage cors set administrative-documents --allowed-origins "*" --allowed-headers "*" --allowed-methods "GET,POST,DELETE"
```

## Troubleshooting

### If you still get errors:

1. **Check bucket name**: Ensure it's exactly `administrative-documents` (with hyphen, not underscore)

2. **Check permissions**: Make sure the bucket is public or has appropriate policies

3. **Check Supabase connection**: Verify your Supabase URL and anon key in your environment variables

4. **Clear browser cache**: Sometimes old URLs are cached

### Environment Variables to Check:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Notes

- Documents are stored in folders based on type: `IN/` and `OUT/`
- File names include timestamps to avoid conflicts
- The database stores references to these files in the `administrative_documents` table
- Make sure your Supabase project has enough storage quota

Once the bucket is created, document uploads and viewing should work correctly!