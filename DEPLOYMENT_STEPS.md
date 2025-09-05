# PHP Backend Deployment Steps

## New Files Added for Resident Photos

I've implemented the `resident-photos` endpoint for your PHP backend. Here are the files that need to be deployed:

### 1. Modified Files:
- `api/php/index.php` - Added resident-photos endpoint to router

### 2. New Files:
- `api/php/resident-photos.php` - Complete endpoint implementation
- `api/php/uploads/.htaccess` - Security and CORS configuration

### 3. Directories to Create:
- `api/php/uploads/` - Main uploads directory  
- `api/php/uploads/resident-photos/` - Resident photos storage

## Deployment Instructions

### Step 1: Upload Files to Hostinger
Upload these files to your Hostinger server at the correct paths:

1. **Replace** `public_html/api/php/index.php`
2. **Upload new** `public_html/api/php/resident-photos.php`
3. **Create directory** `public_html/api/php/uploads/`
4. **Create directory** `public_html/api/php/uploads/resident-photos/`
5. **Upload** `public_html/api/php/uploads/.htaccess`

### Step 2: Set Directory Permissions
Set proper permissions for the uploads directory:
```
chmod 755 public_html/api/php/uploads/
chmod 755 public_html/api/php/uploads/resident-photos/
```

### Step 3: Test the API
After deployment, test the endpoint:
```bash
curl -X GET "https://steen.eastatwest.com/api/php/index.php?endpoint=resident-photos" \
  -H "X-Api-Key: 20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a"
```

Expected response:
```json
{
    "success": true,
    "data": {},
    "count": 0
}
```

## What the Endpoint Does

### GET Requests
- `?endpoint=resident-photos` - Get all resident photos (returns badge_number → photo_url mapping)
- `?endpoint=resident-photos&badge_number=12345` - Get specific resident photo

### POST Requests
- Uploads a photo file for a specific resident
- Creates/updates database record
- Returns the photo URL for immediate use

### DELETE Requests  
- `?endpoint=resident-photos&badge_number=12345` - Delete resident photo and file

## Database Table
The endpoint automatically creates the `resident_photos` table with:
- `id` (auto-increment primary key)
- `badge_number` (unique resident identifier)
- `photo_filename` (stored filename)
- `photo_url` (public URL path)
- `file_size`, `mime_type` (metadata)
- `created_at`, `updated_at` (timestamps)

## Security Features
- API key validation required
- File type validation (images only)
- File size limits (5MB max)
- Directory access protection
- No PHP execution in uploads directory
- CORS headers for cross-origin access

## Integration Status
✅ Frontend code is ready and integrated
✅ PHP backend endpoint is implemented  
⏳ **Needs deployment to Hostinger server**

Once deployed, the Residents Grid will automatically:
1. Load existing photos from the database on page load
2. Upload new photos to the server and database
3. Display photos with the lightbox feature
4. Persist all images across sessions