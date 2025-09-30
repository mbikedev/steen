# Debug Analysis: ResidentDocumentsModal Upload Buttons Issue

## Problem Description
Two upload buttons in the ResidentDocumentsModal aren't working when clicked.

## Key Findings from Code Analysis

### 1. File Input Setup
- **Location**: Line 74 - `const fileInputRef = useRef<HTMLInputElement>(null);`
- **HTML Input**: Lines 1035-1042 - Hidden file input with `ref={fileInputRef}`
- **Accept Types**: `.pdf,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.doc,.docx,.xls,.xlsx`
- **Multiple Files**: `multiple` attribute is set

### 2. Upload Buttons
Found **TWO** upload buttons that trigger `fileInputRef.current?.click()`:

#### Button 1 (Lines 1025-1034)
```tsx
<button
  onClick={() => fileInputRef.current?.click()}
  className="flex items-center justify-center space-x-2 bg-foreground hover:bg-foreground/90 text-white px-4 py-2 rounded-md transition-colors text-sm"
>
  <Upload className="w-4 h-4" />
  <span className="hidden sm:inline">Document Uploaden</span>
  <span className="sm:hidden">Upload</span>
</button>
```

#### Button 2 (Lines 1149-1158)
```tsx
<button
  onClick={() => fileInputRef.current?.click()}
  className="mt-2 px-3 sm:px-4 py-2 bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors text-sm"
>
  <Upload className="w-4 h-4 inline-block mr-2" />
  <span className="hidden sm:inline">Eerste Document Uploaden</span>
  <span className="sm:hidden">Upload Document</span>
</button>
```

### 3. File Upload Handler
- **Function**: `handleFileUpload` (Lines 309-528)
- **Trigger**: `onChange={handleFileUpload}` on the file input
- **Console Logs**: Extensive logging throughout the upload process

### 4. Potential Issues Identified

#### A. Event Propagation Issues
The modal has multiple `stopPropagation()` calls:
- Modal background click handler (Line 704)
- Modal content click handler (Line 734)
- Close button click handler (Line 802)

**Risk**: These might interfere with button click events.

#### B. Modal State Management
- Modal uses complex ESC key handling with event capture
- Body overflow manipulation
- URL preservation logic

#### C. Upload Status States
The upload process uses status states:
- `uploadStatus`: "idle" | "uploading" | "success" | "error"
- During "uploading" state, buttons might appear unresponsive

#### D. API Dependencies
Upload depends on:
- `apiService.uploadAdministrativeDocument()`
- Supabase authentication
- Storage bucket existence
- Resident data validation

### 5. Debugging Steps

#### Step 1: Check Browser Console
Look for:
- JavaScript errors
- Network request failures
- API authentication issues
- Console logs from `handleFileUpload`

#### Step 2: Verify File Input Reference
```javascript
// In browser console:
console.log('File input ref:', document.querySelector('input[type="file"]'));
```

#### Step 3: Test Button Click
```javascript
// In browser console:
document.querySelector('button[onClick*="fileInputRef"]')?.click();
```

#### Step 4: Check Event Listeners
```javascript
// In browser console:
getEventListeners(document.querySelector('input[type="file"]'));
```

### 6. Most Likely Causes

1. **JavaScript Error**: An uncaught error preventing the click handler from executing
2. **File Input Not Mounted**: The ref might be null when buttons are clicked
3. **Event Interference**: Modal's event handling interfering with button clicks
4. **Upload Status Lock**: Component might be in "uploading" state preventing new uploads
5. **API/Network Issues**: Backend problems causing silent failures

### 7. Quick Fixes to Try

#### Fix 1: Add Error Boundaries
```tsx
const handleButtonClick = () => {
  try {
    console.log('Button clicked, fileInputRef:', fileInputRef.current);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      console.error('File input ref is null');
    }
  } catch (error) {
    console.error('Error clicking file input:', error);
  }
};
```

#### Fix 2: Prevent Event Bubbling
```tsx
<button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  }}
  // ... other props
>
```

#### Fix 3: Check Upload Status
Ensure buttons are only clickable when `uploadStatus === "idle"`:
```tsx
<button
  onClick={() => fileInputRef.current?.click()}
  disabled={uploadStatus === "uploading"}
  // ... other props
>
```

## Recommended Investigation Order

1. Open browser console and check for errors
2. Run the debug script: `/debug-upload-buttons.js`
3. Check if file input exists and is properly referenced
4. Verify button click events are firing
5. Test API connectivity and authentication
6. Check Supabase storage bucket configuration