# Administrative Documents Setup Guide

## 🎯 Overview
This guide will help you set up the administrative documents system that was referenced in the error logs. The system requires both a database table and storage buckets to function properly.

## ❌ Current Issue
The error `"Could not find the table 'public.administrative_documents' in the schema cache"` indicates that the administrative documents table hasn't been created in your Supabase database yet.

## 🛠️ Setup Steps

### Step 1: Create Database Table

1. **Go to Supabase Dashboard**:
   - Open your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the Table Creation Script**:
   - Copy the contents of `/scripts/create-administrative-documents-table.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

3. **Verify Table Creation**:
   - Check the **Table Editor** to see the new `administrative_documents` table
   - Verify all columns are present

### Step 2: Create Storage Buckets

1. **Navigate to Storage**:
   - Go to **Storage** in the Supabase dashboard
   - Click **New Bucket**

2. **Create IN Documents Bucket**:
   - **Name**: `administrative-documents`
   - **Public**: ✅ Make public
   - **File size limit**: 50MB (adjust as needed)
   - **Allowed MIME types**: Leave empty for all types

3. **Create OUT Documents Bucket**:
   - **Name**: `administrative-documents-out`
   - **Public**: ✅ Make public
   - **File size limit**: 50MB (adjust as needed)
   - **Allowed MIME types**: Leave empty for all types

4. **Set Bucket Policies** (if needed):
   ```sql
   -- Allow authenticated users to upload, download, and delete files
   -- Run these in SQL Editor if you need custom policies

   -- For administrative-documents bucket
   CREATE POLICY "Allow all operations on administrative documents"
   ON storage.objects
   FOR ALL
   USING (bucket_id = 'administrative-documents');

   -- For administrative-documents-out bucket
   CREATE POLICY "Allow all operations on administrative documents out"
   ON storage.objects
   FOR ALL
   USING (bucket_id = 'administrative-documents-out');
   ```

### Step 3: Test the Setup

1. **Run Test Script**:
   - Open your browser console on the application
   - Run: `testAdministrativeDocumentsSetup()`
   - Verify all tests pass

2. **Test Document Upload**:
   - Navigate to Administrative Documents page
   - Click on a resident
   - Try uploading a test document
   - Verify it appears in the list

## 📋 Database Table Schema

The `administrative_documents` table includes these key columns:

```sql
- id (Primary Key)
- resident_id (Foreign Key → residents table)
- document_type ('IN' or 'OUT')
- file_name, file_path, file_size, mime_type
- description
- resident_badge, resident_name (for organization)
- storage_path (organized folder path)
- uploaded_by (user who uploaded)
- created_at, updated_at (timestamps)
```

## 📁 Storage Organization

Documents are organized using this folder structure:

### IN Documents (administrative-documents bucket):
```
administrative-documents/
├── 24191_John_Doe/
│   ├── bijlage26_document.pdf
│   ├── toewijzing_form.pdf
│   └── passport_scan.jpg
├── 12345_Maria_Garcia/
│   └── identity_card.jpg
└── [Other residents...]
```

### OUT Documents (administrative-documents-out bucket):
```
administrative-documents-out/
├── 24191_John_Doe/
│   ├── bijlage26_document.pdf (transferred from IN)
│   ├── ontslagbrief_document.pdf
│   └── eindrapport_form.pdf
└── [Other residents...]
```

## 🔧 Features Included

✅ **Organized Folder Structure**: Each resident gets their own folder
✅ **Automatic Document Transfer**: IN → OUT when resident status changes
✅ **Folder Cleanup**: Original IN folders deleted to prevent duplicates
✅ **Enhanced Metadata**: Resident information stored with documents
✅ **Delete Functionality**: OUT residents can be permanently deleted
✅ **File Type Support**: PDF, images, Word, Excel, and more
✅ **Duplicate Prevention**: Won't upload files with same name

## 🧪 Testing Scripts

After setup, you can test with these scripts:

```javascript
// Test database table setup
testAdministrativeDocumentsSetup()

// Test storage bucket configuration
testStorageBucketsSetup()

// Test IN folder organization
testInFolderOrganization("24191")

// Test document transfer and cleanup
testInFolderCleanup("24191")

// Test OUT resident deletion
testOutResidentDeletion()
```

## ⚠️ Troubleshooting

### Table Not Found Error:
- Make sure you ran the SQL script in Supabase Dashboard
- Check the table appears in Table Editor
- Verify RLS policies are correctly set

### Storage Upload Errors:
- Check storage buckets exist and are public
- Verify bucket policies allow file operations
- Check file size limits

### Permission Errors:
- Ensure RLS policies are configured correctly
- Check that your user has proper authentication

## 🎉 After Setup

Once setup is complete, you'll have:

1. **Document Upload**: Upload documents via ResidentDocumentsModal
2. **Organized Storage**: Files automatically organized in resident folders
3. **Transfer System**: Documents move from IN → OUT with resident status
4. **Cleanup System**: Original folders deleted to prevent duplicates
5. **Delete System**: OUT residents can be permanently removed

The administrative documents system will then work seamlessly with your existing resident management workflow!

## 📞 Support

If you encounter issues during setup:

1. Check browser console for detailed error messages
2. Verify all SQL scripts ran without errors
3. Test each component individually using the test scripts
4. Check Supabase dashboard for any configuration issues