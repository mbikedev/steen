# Organized Storage Structure for Administrative Documents

## 🎯 Overview

The document management system now creates **organized folder structures** in **both** storage buckets: `administrative-documents` (IN documents) and `administrative-documents-out` (OUT documents). Each resident gets their own dedicated folder with a standardized naming convention, making document management much more efficient and organized across the entire document lifecycle.

## 📁 Folder Structure

### **Folder Naming Convention**
```
Badge_FirstName_LastName
```

### **Examples**
- `24191_John_Doe`
- `12345_Maria_Garcia`
- `67890_Ahmed_Hassan`
- `55555_Anna_Van_Der_Berg`

### **Storage Organization**
```
📁 IN Documents (administrative-documents)
administrative-documents/
├── 24191_John_Doe/
│   ├── bijlage26_document.pdf
│   ├── toewijzing_form.pdf
│   ├── passport_scan.jpg
│   └── medical_records.pdf
├── 12345_Maria_Garcia/
│   ├── bijlage26_document.pdf
│   └── identity_card.jpg
└── 67890_Ahmed_Hassan/
    ├── bijlage26_document.pdf
    └── toewijzing_form.pdf

📁 OUT Documents (administrative-documents-out)
administrative-documents-out/
├── 24191_John_Doe/
│   ├── ontslagbrief_document.pdf
│   ├── eindrapport_form.pdf
│   └── doorverwijzing_docs.pdf
├── 12345_Maria_Garcia/
│   ├── ontslagbrief_document.pdf
│   └── transfer_letter.pdf
└── 67890_Ahmed_Hassan/
    ├── ontslagbrief_document.pdf
    └── administratieve_afsluiting.pdf
```

## 🔧 Technical Implementation

### **Storage Organization Utilities**
File: `/lib/supabase/storage-organization-utils.ts`

Key functions:
- `createResidentFolderName()` - Creates standardized folder names
- `createOrganizedStoragePath()` - Generates organized file paths
- `createDocumentDescription()` - Enhanced descriptions with folder info
- `parseResidentFolderName()` - Extracts info from folder names

### **Enhanced Document Management**
Files: `/lib/supabase/document-transfer-api.ts` & `/lib/api-service.ts`

**Document Transfer (IN → OUT):**
- ✅ Automatic folder creation during transfer
- ✅ Maintains same folder structure across buckets
- ✅ Enhanced file descriptions with resident info
- ✅ Proper path handling for organized structure
- ✅ **Automatic IN folder cleanup to prevent duplicates**

**Document Upload (New IN documents):**
- ✅ Automatic organized folder creation on upload
- ✅ Resident information integration
- ✅ Enhanced database metadata with folder info
- ✅ Same folder naming convention as OUT documents

**Storage Cleanup:**
- ✅ Safe deletion of IN folders after successful transfer
- ✅ Verification checks to prevent accidental deletions
- ✅ Detailed logging of cleanup operations
- ✅ Error handling ensures process continues if cleanup fails

## 🎯 Benefits

### **✅ Easy Document Identification**
- **Before**: `bijlage26.pdf`, `toewijzing.pdf` (which resident?)
- **After**: `24191_John_Doe/bijlage26.pdf` (clearly belongs to John Doe, badge 24191)
- **Consistent**: Same folder structure for both IN and OUT documents

### **✅ Scalable Organization**
- Supports hundreds of residents without confusion
- Each resident's documents are isolated in their own folder
- Easy to find and manage specific resident documents

### **✅ Better Storage Management**
- Clear folder structure for admins
- Easy cleanup when residents leave
- Reduced risk of accidental document mixing

### **✅ Enhanced Tracking**
- Document descriptions include resident folder information
- Transfer logs show organized paths
- Better audit trail for document management

## 🚀 Usage Examples

### **New IN Document Upload**
When you upload a new document for a resident:

1. **System automatically**:
   - Creates resident folder in administrative-documents bucket
   - Places document in organized folder structure
   - Updates database with enhanced metadata

2. **Result**:
   ```
   administrative-documents/24191_John_Doe/
   ├── bijlage26_document.pdf
   ├── toewijzing_form.pdf
   └── passport_scan.jpg
   ```

### **Document Transfer (IN → OUT)**
When you move a resident to OUT status:

1. **System automatically**:
   - Creates folder: `24191_John_Doe` in OUT bucket
   - Transfers all documents to the organized folder
   - Maintains same folder structure and naming
   - **🗑️ Deletes original IN folder to prevent duplicates**

2. **Result**:
   ```
   ✅ OUT Documents (administrative-documents-out)
   administrative-documents-out/24191_John_Doe/
   ├── bijlage26_document.pdf (transferred from IN)
   ├── toewijzing_form.pdf (transferred from IN)
   ├── passport_scan.jpg (transferred from IN)
   └── ontslagbrief_document.pdf (new OUT document)

   🗑️ IN Documents (administrative-documents) - CLEANED UP
   administrative-documents/24191_John_Doe/ ← DELETED
   ```

### **Manual Transfer via API**
```javascript
fetch('/api/documents/transfer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    residentId: 123,
    residentBadge: '24191',
    residentName: 'John Doe',
    transferMethod: 'transfer'
  })
});
```

### **Folder Name Preview**
```javascript
// Preview what folder name will be created
const folderName = createResidentFolderName({
  badge: '24191',
  firstName: 'John',
  lastName: 'Doe'
});
console.log(folderName); // "24191_John_Doe"
```

## 📋 File Naming Rules

### **Folder Names**
- **Format**: `Badge_FirstName_LastName`
- **Special Characters**: Removed (àáâã becomes aaa)
- **Spaces**: Converted to underscores
- **Case**: Preserved from original names

### **File Names**
- **Special Characters**: Converted to underscores
- **Extensions**: Preserved (.pdf, .jpg, .docx, etc.)
- **Document Type**: May be prefixed for clarity

### **Examples of Name Sanitization**
| Original Name | Sanitized Folder Name |
|---------------|----------------------|
| João da Silva | `24191_Joao_da_Silva` |
| Marie-Claire Dubois | `12345_Marie_Claire_Dubois` |
| Ahmed Al-Hassan | `67890_Ahmed_Al_Hassan` |
| Anna van der Berg | `55555_Anna_van_der_Berg` |

## 🔍 Verification and Testing

### **Manual Verification Steps**
1. Go to **Supabase Dashboard** > **Storage** > **administrative-documents-out**
2. Look for folders with format: `Badge_FirstName_LastName`
3. Open folder to verify all documents are properly organized
4. Check that file names are preserved and accessible

### **Testing Script**
Run in browser console: `/scripts/test-organized-transfer-24191.js`

```javascript
// Test organized transfer
testOrganizedTransfer24191();

// Preview folder structure
simulateFolderStructure('24191', 'John', 'Doe');

// Check existing organization
checkExistingFolderOrganization();
```

## 📊 Database Integration

### **Enhanced Document Records**
The database now stores enhanced information:

```sql
administrative_documents {
  -- Standard fields
  file_name: 'bijlage26_document.pdf'
  file_path: 'https://...administrative-documents-out/24191_John_Doe/bijlage26_document.pdf'

  -- Enhanced tracking
  resident_badge: '24191'
  resident_name: 'John Doe'
  storage_path: '24191_John_Doe/bijlage26_document.pdf'
  description: 'Bijlage 26 document (Bewoner: 24191_John_Doe, Overgedragen: 15/01/2024)'
}
```

### **Youth Overview Integration**
```sql
youth_overview {
  badge: '24191'
  tab_location: 'OUT'
  datum_transfer: '2024-01-15'
  transferdossier_verzonden: '3 documenten overgedragen naar 24191_John_Doe'
}
```

## 🔧 Migration for Existing Documents

If you have existing documents without folder organization:

### **Automatic Migration Scripts**

**For IN Documents:**
```javascript
// Run in browser console: /scripts/migrate-in-documents-to-folders.js
previewInDocumentMigration(); // Preview what will be migrated (safe)
migrateInDocumentsToFolders(); // Run the actual migration
```

**For OUT Documents (if needed):**
```javascript
// Previous OUT migration already available
testOrganizedTransfer24191(); // Test transfer with folder organization
```

### **Manual Organization (Alternative)**
1. **Identify unorganized files** in storage buckets
2. **Create resident folders** manually in Supabase dashboard
3. **Move files** to appropriate resident folders
4. **Update database** file_path records with enhanced metadata

## 🎉 Summary

The new organized storage structure provides:

- **📁 Clear Organization**: Each resident has their own folder
- **🔍 Easy Identification**: No more generic filename confusion
- **📈 Scalability**: Supports growth to hundreds of residents
- **🛡️ Data Integrity**: Reduced risk of document mix-ups
- **🔧 Better Management**: Easier for admins to manage and cleanup
- **🗑️ No Duplicates**: Automatic cleanup prevents duplicate files in storage

**Example Results for Resident 24191:**

```
📁 IN Documents (administrative-documents)
administrative-documents/24191_John_Doe/
├── bijlage26_document.pdf
├── toewijzing_form.pdf
├── passport_scan.jpg
├── medical_records.pdf
└── identity_documents.pdf

📁 OUT Documents (administrative-documents-out)
administrative-documents-out/24191_John_Doe/
├── bijlage26_document.pdf (transferred from IN)
├── toewijzing_form.pdf (transferred from IN)
├── passport_scan.jpg (transferred from IN)
├── ontslagbrief_document.pdf
└── eindrapport_form.pdf
```

Perfect organization for easy document management across the entire lifecycle! 🚀

## 🧪 Testing Scripts

**Test IN Folder Organization:**
```javascript
// /scripts/test-in-folder-organization.js
testInFolderOrganization("24191"); // Test with specific resident
testCompleteInUploadFlow("24191");  // Test complete upload flow
```

**Test OUT Transfer Organization:**
```javascript
// /scripts/test-organized-transfer-24191.js
testOrganizedTransfer24191(); // Test transfer with folder organization
```

**Test IN Folder Cleanup:**
```javascript
// /scripts/test-in-folder-cleanup.js
testInFolderCleanup("24191"); // Test automatic IN folder cleanup
testTransferWithCleanup("24191"); // Test complete transfer and cleanup flow
```