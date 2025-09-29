# Administrative Documents OUT Workflow

## 🎯 Overview

When a resident moves to OUT status on the Administratieve Documenten page, the system now automatically:

1. **Transfers all documents** from the IN bucket to the OUT bucket (`administrative-documents-out`)
2. **Updates the youth overview** status to OUT with transfer information
3. **Preserves all resident data** in the database
4. **Logs the status change** with document transfer details
5. **Shows transfer status** in the document modal

## 🔄 Complete OUT Process

### Step 1: Document Transfer
- **Source**: Documents in `administrative-documents/IN/` folder
- **Destination**: Documents moved to `administrative-documents/OUT/` folder
- **Database**: Records updated from `document_type: 'IN'` to `document_type: 'OUT'`
- **Preservation**: Original documents can optionally be kept (configurable)

### Step 2: Youth Overview Update
- **Status**: `tab_location` changed from `'IN'` to `'OUT'`
- **Transfer Date**: `datum_transfer` set to current date
- **Status Field**: `out_status` set to `'Uitgegaan'`
- **Notes**: `transferdossier_verzonden` set to `'Documenten overgedragen'`

### Step 3: Resident Status Update
- **Database**: `status` field updated to `'OUT'`
- **OUT Date**: `date_out` set to current date
- **Data Preservation**: All other resident data remains intact

### Step 4: Status History Logging
- **Previous Status**: Recorded (e.g., "Actief")
- **New Status**: Set to "OUT"
- **Change Details**: Includes document transfer count
- **Timestamp**: Automatic logging with system user

## 📂 Document Management Features

### Automatic Document Transfer
```typescript
// Enhanced moveToOutAndDelete function now includes:
const documentTransferResult = await transferResidentDocumentsToOut(
  residentId,
  resident.badge.toString(),
  `${resident.first_name} ${resident.last_name}`
);
```

### Transfer Status Indicators
- ✅ **Green**: Documents successfully transferred
- ⚠️ **Yellow**: No documents transferred (resident is OUT but no transfer occurred)
- 📁 **Blue**: Shows count of IN documents (for active residents)

### Document Sync for OUT Residents
- **Primary**: Syncs OUT documents from `administrative-documents-out` bucket
- **Secondary**: Also syncs any remaining IN documents for complete view

## 🔧 API Endpoints

### Document Transfer API
```
POST /api/documents/transfer
{
  "residentId": 123,
  "residentBadge": "001",
  "residentName": "John Doe",
  "transferMethod": "transfer" // or "copy"
}
```

### Transfer Status API
```
GET /api/documents/transfer?residentId=123
```

### Youth Overview API
```
POST /api/youth-overview/[badge]/move
{
  "tab": "OUT",
  "datum_transfer": "2024-01-15",
  "out_status": "Uitgegaan"
}
```

## 🎨 UI Enhancements

### Document Modal Improvements
1. **Status Indicators**: Visual badges showing transfer status
2. **Document Type Detection**: Automatically handles IN/OUT document sync
3. **Enhanced Loading**: Loads appropriate documents based on resident status

### Administrative Documents Page
- **OUT Section**: Shows residents who have been moved to OUT status
- **Transfer Logging**: All transfers are logged with details
- **Smart Sync**: Handles both IN and OUT document synchronization

## 🗄️ Database Schema

### Administrative Documents Table
```sql
administrative_documents {
  id: number (primary key)
  resident_id: number (foreign key)
  document_type: 'IN' | 'OUT'  -- Key field for transfer
  file_name: string
  file_path: string            -- Updated to OUT bucket URL
  file_size: number
  mime_type: string
  description: string          -- Includes transfer timestamp
  resident_badge: string       -- Enhanced for better tracking
  resident_name: string        -- Enhanced for better tracking
  storage_path: string         -- Physical storage path
  created_at: timestamp
  updated_at: timestamp
}
```

### Youth Overview Table
```sql
youth_overview {
  badge: string (unique)
  tab_location: 'IN' | 'OUT'   -- Updated during transfer
  datum_transfer: string       -- Set when moved to OUT
  out_status: string           -- Status description
  transferdossier_verzonden: string -- Transfer notes
  -- ... other fields
}
```

### Resident Status History
```sql
resident_status_history {
  resident_id: number
  previous_status: string
  new_status: 'OUT'
  status_type: 'OUT'
  change_date: timestamp
  changed_by: string
  reason: string
  notes: string                -- Includes document transfer count
}
```

## 🚀 Usage Instructions

### For Staff Using the System

1. **Navigate to Administratieve Documenten**
2. **Find the resident** in the IN section
3. **Click the status dropdown** and select "OUT"
4. **Confirm the action** when prompted
5. **Automatic Process Begins**:
   - Documents transfer to OUT bucket
   - Youth overview updates
   - Status history logs
   - Resident moves to OUT section

### Viewing Transferred Documents

1. **Go to OUT section** in Administratieve Documenten
2. **Click on the resident** to open documents modal
3. **See transfer status** in the header (green checkmark)
4. **View all documents** now stored in OUT bucket

### Manual Document Transfer (if needed)

```javascript
// If automatic transfer fails, manual API call:
fetch('/api/documents/transfer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    residentId: 123,
    residentBadge: '001',
    residentName: 'John Doe',
    transferMethod: 'transfer' // or 'copy' to keep originals
  })
});
```

## 🔍 Monitoring and Troubleshooting

### Console Logging
The system provides comprehensive logging:
- `📂 Step 1: Transferring documents to OUT bucket`
- `📊 Step 2: Updating youth overview status`
- `📝 Step 3: Updating resident status in database`
- `📝 Step 4: Logging status change`

### Error Handling
- **Partial Failures**: Process continues even if some steps fail
- **Transfer Errors**: Logged but don't block resident status update
- **Rollback**: Manual intervention may be needed for failed transfers

### Verification Steps
1. **Check OUT section**: Resident appears in OUT list
2. **Open documents modal**: Status shows "Documenten overgedragen"
3. **Verify OVERZICHT JONGEREN**: Resident in OUT tab
4. **Check storage**: Documents exist in OUT bucket

## 📊 Benefits

### ✅ Complete Workflow Integration
- Single action triggers comprehensive OUT process
- All systems updated consistently
- No manual intervention required

### ✅ Data Preservation
- All documents preserved and accessible
- Complete audit trail maintained
- No data loss during transitions

### ✅ Enhanced Tracking
- Visual status indicators
- Comprehensive logging
- Transfer history maintained

### ✅ User Experience
- Seamless workflow
- Clear status feedback
- Error handling and recovery

## 🔄 Future Enhancements

### Potential Improvements
1. **Bulk Transfer**: Move multiple residents to OUT simultaneously
2. **Transfer Templates**: Pre-configured transfer types
3. **Email Notifications**: Notify relevant staff of transfers
4. **Advanced Reporting**: Transfer analytics and statistics
5. **Document Versioning**: Track document history across transfers

The system now provides a complete, automated workflow for moving residents to OUT status while ensuring all documents are properly transferred and preserved in the administrative-documents-out storage bucket! 🎉