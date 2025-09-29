# Administrative Documents Database Setup

I've created the necessary database tables and API methods to store IN and OUT files for the Administratieve Documenten page.

## Database Tables Created

### 1. `administrative_documents`
Stores uploaded document files for residents:
- `id` - Primary key
- `resident_id` - References residents table
- `document_type` - 'IN' or 'OUT'
- `file_name` - Original file name
- `file_path` - Storage path/URL
- `file_size` - File size in bytes
- `mime_type` - File MIME type
- `description` - Optional description
- `uploaded_by` - Who uploaded the file
- `created_at` - Upload timestamp
- `updated_at` - Last modified timestamp

### 2. `resident_status_history`
Tracks when residents move between IN and OUT status:
- `id` - Primary key
- `resident_id` - References residents table
- `previous_status` - Previous status
- `new_status` - New status
- `status_type` - 'IN' or 'OUT'
- `change_date` - When the change occurred
- `changed_by` - Who made the change
- `reason` - Reason for change
- `notes` - Additional notes

### 3. `document_categories`
Defines document categories for IN and OUT processes:
- `id` - Primary key
- `name` - Category name
- `description` - Category description
- `document_type` - 'IN' or 'OUT'
- `is_required` - Whether this document type is required
- `sort_order` - Display order

### 4. Storage Bucket
- `administrative-documents` - Supabase storage bucket for files

## How to Apply the Migration

### Option 1: Apply via Supabase Dashboard
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migrations/004_add_administrative_documents_tables.sql`
4. Execute the SQL

### Option 2: Apply via psql (if you have direct database access)
```bash
psql "postgresql://postgres:[PASSWORD]@db.xxcbpsjefpogxgfellui.supabase.co:5432/postgres" < supabase/migrations/004_add_administrative_documents_tables.sql
```

### Option 3: Use the MCP Server (if configured)
You can use Claude with the MCP server to execute the migration:
1. Set up the MCP server (see MCP_SETUP.md)
2. Ask Claude to execute the migration SQL

## Pre-populated Data

The migration includes default document categories:

### IN Document Types:
- Identiteitsdocument (required)
- Verblijfsvergunning
- Medische Documenten
- Inschrijvingsdocumenten (required)
- Financiële Documenten

### OUT Document Types:
- Ontslagbrief (required)
- Doorverwijzingsdocumenten
- Eindrapport
- Retournering Documenten
- Administratieve Afsluiting (required)

## API Methods Added

New methods in `api-service.ts`:

### Administrative Documents:
- `getAdministrativeDocuments(residentId?, documentType?)` - Get documents
- `uploadAdministrativeDocument(file, metadata)` - Upload new document
- `deleteAdministrativeDocument(id)` - Delete document and file

### Document Categories:
- `getDocumentCategories(documentType?)` - Get categories
- `createDocumentCategory(category)` - Create new category

### Status History:
- `getResidentStatusHistory(residentId?, statusType?)` - Get status history
- `createStatusHistoryEntry(entry)` - Log status change

## Updated Features

### DataContext Changes:
- `moveToOutAndDelete()` now logs status changes to the database
- Status history is automatically recorded when residents move to OUT

### Database Types:
- Added TypeScript types for new tables in `database.types.ts`

## Usage Examples

### Upload Document for Resident:
```typescript
const file = new File(['content'], 'document.pdf', { type: 'application/pdf' });
await apiService.uploadAdministrativeDocument(file, {
  resident_id: 123,
  document_type: 'IN',
  description: 'Identity document',
  uploaded_by: 'Staff Member'
});
```

### Get Documents for Resident:
```typescript
const inDocuments = await apiService.getAdministrativeDocuments(123, 'IN');
const outDocuments = await apiService.getAdministrativeDocuments(123, 'OUT');
```

### Get Status History:
```typescript
const history = await apiService.getResidentStatusHistory(123);
```

## Next Steps

1. **Apply the migration** using one of the methods above
2. **Update the Administrative Documents page** to use the new database methods
3. **Add file upload functionality** to the page
4. **Test the integration** by uploading and retrieving documents

The database structure is now ready to store and manage all IN and OUT documents for residents! 🎉
