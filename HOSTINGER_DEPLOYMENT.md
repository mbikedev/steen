# Hostinger Deployment Guide for Asylum Center Dashboard

This guide will help you deploy the Asylum Center Dashboard with PHP/MySQL backend and resident photo upload functionality on Hostinger.

## Prerequisites

- Hostinger hosting account (Premium or Business plan recommended)
- Access to Hostinger hPanel
- FTP/SFTP client (like FileZilla) or use Hostinger's File Manager
- Domain configured and pointing to your Hostinger hosting

## Step 1: Database Setup

### 1.1 Create MySQL Database

1. Log in to your Hostinger hPanel
2. Navigate to **Databases → MySQL Databases**
3. Click **Create New Database**
4. Enter database details:
   - Database name: `asylum_center` (or your preferred name)
   - Username: Create a new username
   - Password: Generate a strong password
5. Save these credentials securely

### 1.2 Import Database Schema

1. Go to **Databases → phpMyAdmin**
2. Select your newly created database
3. Click on **Import** tab
4. Upload the `api/php/schema.sql` file
5. Click **Go** to execute the import

## Step 2: Configure PHP Backend

### 2.1 Update Configuration

Edit `api/php/config.php` with your Hostinger database credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'u734544155_mikaty');
define('DB_USER', 'u734544155_oscar');
define('DB_PASS', '2#^HT?v2kI');
define('API_KEY', '20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a');
define('CORS_ORIGIN', 'https://steen.eastatwest.com');
```

### 2.2 API Key Configuration

Your secure API key is already generated and configured:
```
20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a
```

This key is already set in both `config.php` and `.env.local`.

### 2.3 Upload PHP Files

Upload the following to your Hostinger hosting:

1. Create directory structure in `public_html`:
   ```
   public_html/
   └── api/
       └── php/
           ├── .htaccess
           ├── config.php
           ├── index.php (main router)
           ├── residents.php
           ├── resident-photos.php (NEW)
           └── uploads/ (NEW)
               ├── .htaccess (NEW)
               └── resident-photos/ (NEW)
   ```

2. Using FTP or File Manager:
   - Upload all files from `api/php/` to `public_html/api/php/`
   - Create `uploads/` directory with proper permissions (755)
   - Create `uploads/resident-photos/` subdirectory (755)
   - Upload `uploads/.htaccess` for security
   - Ensure all `.htaccess` files are uploaded (may be hidden)

### 2.4 Set File Permissions

Set appropriate permissions via File Manager or FTP:
- PHP files: 644
- Directories: 755  
- config.php: 600 (for security)
- uploads/ directory: 755 (writable)
- uploads/resident-photos/ directory: 755 (writable)

## Step 3: Frontend Configuration

### 3.1 Update Environment Variables

Create `.env.production` file in your Next.js project:

```env
NEXT_PUBLIC_API_URL=https://steen.eastatwest.com/api/php/index.php
NEXT_PUBLIC_API_KEY=20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a
```

**Note:** Environment variables are already configured in `.env.local` for development.

### 3.2 Build Next.js Application

```bash
# Build the production version
npm run build

# Test locally with production build
npm run start
```

## Step 4: Deploy Frontend

### Option A: Deploy to Hostinger (Static Export)

1. Configure Next.js for static export in `next.config.js`:
```javascript
module.exports = {
  output: 'export',
  // ... other config
}
```

2. Build static files:
```bash
npm run build
```

3. Upload the `out` directory contents to `public_html`

### Option B: Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Option C: Deploy to Netlify

1. Push your code to GitHub
2. Connect repository to Netlify
3. Add environment variables
4. Set build command: `npm run build`
5. Set publish directory: `.next`

## Step 5: New Resident Photos Endpoint

The `resident-photos.php` endpoint provides complete image management:

### 5.1 Features
- **Upload**: Store resident photos in database with file management
- **Retrieve**: Get all photos or specific resident photo
- **Delete**: Remove photos and clean up files
- **Security**: File type validation, size limits, secure storage

### 5.2 Database Table
Auto-creates `resident_photos` table with:
- `badge_number` (resident identifier)
- `photo_filename` (stored filename)
- `photo_url` (public URL path)
- `file_size`, `mime_type` (metadata)
- `created_at`, `updated_at` (timestamps)

### 5.3 API Endpoints
- `GET ?endpoint=resident-photos` - Get all resident photos
- `GET ?endpoint=resident-photos&badge_number=123` - Get specific photo
- `POST ?endpoint=resident-photos` - Upload photo (requires badge_number + photo file)
- `DELETE ?endpoint=resident-photos&badge_number=123` - Delete photo

## Step 6: Additional PHP Endpoints

Create these additional PHP files in `api/php/`:

### 6.1 test-connection.php
```php
<?php
define('API_ACCESS', true);
require_once 'config.php';

setCorsHeaders();
validateApiKey();

try {
    $db = Database::getInstance()->getConnection();
    sendJsonResponse([
        'success' => true,
        'message' => 'Database connection successful',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'error' => 'Database connection failed'
    ], 500);
}
```

### 6.2 residents-batch.php
```php
<?php
define('API_ACCESS', true);
require_once 'config.php';

setCorsHeaders();
validateApiKey();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['error' => 'Method not allowed'], 405);
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['residents']) || !is_array($data['residents'])) {
    sendJsonResponse(['error' => 'Invalid data format'], 400);
}

$db = Database::getInstance()->getConnection();
$results = [];

$db->beginTransaction();

try {
    foreach ($data['residents'] as $resident) {
        // Insert each resident
        $query = "INSERT INTO residents (badge, first_name, last_name, block, room, status) 
                  VALUES (:badge, :first_name, :last_name, :block, :room, 'active')";
        
        $stmt = $db->prepare($query);
        $stmt->execute([
            ':badge' => $resident['badge'],
            ':first_name' => $resident['firstName'],
            ':last_name' => $resident['lastName'],
            ':block' => $resident['block'] ?? '',
            ':room' => $resident['room'] ?? ''
        ]);
        
        $results[] = [
            'success' => true,
            'id' => $db->lastInsertId()
        ];
    }
    
    $db->commit();
    sendJsonResponse([
        'success' => true,
        'data' => $results,
        'count' => count($results)
    ]);
    
} catch (Exception $e) {
    $db->rollBack();
    sendJsonResponse(['error' => 'Batch insert failed: ' . $e->getMessage()], 500);
}
```

## Step 7: Testing

### 7.1 Test API Connection

```bash
# Test the connection
curl -X GET https://steen.eastatwest.com/api/php/index.php?endpoint=test-connection \
  -H "X-Api-Key: 20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a"
```

### 7.2 Test Residents Endpoint

```bash
# Get all residents
curl -X GET https://steen.eastatwest.com/api/php/index.php?endpoint=residents \
  -H "X-Api-Key: 20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a"
```

### 7.3 Test Resident Photos Endpoint

```bash
# Get all resident photos
curl -X GET https://steen.eastatwest.com/api/php/index.php?endpoint=resident-photos \
  -H "X-Api-Key: 20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a"
```

## Step 8: Security Checklist

- [x] Secure API key generated and configured
- [x] CORS origin set to your frontend domain only
- [x] File permissions configured properly
- [x] Uploads directory secured with .htaccess
- [ ] SSL certificate enabled (Hostinger provides free SSL)
- [ ] Error display disabled in production
- [ ] Regular backups configured in Hostinger
- [ ] Monitor error logs regularly

## Step 9: Monitoring & Maintenance

### 9.1 Error Logs

Check error logs in Hostinger:
1. Go to **Advanced → PHP Configuration**
2. View PHP error logs
3. Check `api/php/error.log` if configured

### 9.2 Database Backups

Set up automatic backups:
1. Go to **Databases → MySQL Databases**
2. Click on **Backups**
3. Configure automatic daily backups

### 9.3 Performance Optimization

1. Enable caching in Hostinger hPanel
2. Use Hostinger's LiteSpeed Cache if available
3. Optimize images before upload (residents photos auto-handled)
4. Monitor resource usage in hPanel
5. Regular cleanup of uploaded images if needed

## Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check PHP error logs
   - Verify file permissions
   - Check `.htaccess` syntax

2. **Database Connection Failed**
   - Verify credentials in config.php
   - Check database user permissions
   - Ensure database exists

3. **CORS Errors**
   - Update CORS_ORIGIN in config.php
   - Check .htaccess CORS headers
   - Verify API key is being sent

4. **404 Not Found**
   - Check .htaccess RewriteBase
   - Verify file paths
   - Ensure mod_rewrite is enabled

## Support

For Hostinger-specific issues:
- Contact Hostinger support via live chat
- Check Hostinger knowledge base
- Community forums

For application issues:
- Check application logs
- Review this documentation
- Contact development team

## Environment Variables Summary

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL=https://steen.eastatwest.com/api/php/index.php
NEXT_PUBLIC_API_KEY=20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a
```

### Backend (config.php)
```php
DB_HOST='localhost'
DB_NAME='u734544155_mikaty'
DB_USER='u734544155_oscar'
DB_PASS='2#^HT?v2kI'
API_KEY='20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a'
CORS_ORIGIN='https://steen.eastatwest.com'
```

## Deployment Checklist

- [x] Database credentials configured (`u734544155_mikaty`)
- [ ] PHP files uploaded to correct directory
- [x] Configuration updated with credentials
- [x] Resident photos endpoint implemented
- [ ] Upload directories created with proper permissions
- [ ] File permissions set correctly  
- [ ] SSL certificate active
- [x] Frontend environment variables configured
- [ ] API endpoints tested (residents, resident-photos)
- [ ] Backups configured
- [ ] Error logging enabled
- [x] Security measures implemented (API key, CORS, file validation)