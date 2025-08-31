# Server Cleanup - Remove Test Files

## Files to Remove from Server

The following diagnostic files were uploaded to your server during troubleshooting and should be removed for security:

### Remove from `public_html/api/php/`:

```bash
# Test files that should be deleted:
test-standalone.php
test-comprehensive.php  
test-config.php
test-api-endpoint.php
test-direct.php
test-resident-photos-file.php
```

### Why Remove These Files:
- ✅ **Security**: Some files show database credentials and server configuration
- ✅ **Cleanup**: No longer needed since database is working
- ✅ **Performance**: Reduces server clutter

### How to Remove:
1. **Via Hostinger File Manager:**
   - Go to hPanel → Files → File Manager
   - Navigate to `public_html/api/php/`
   - Delete all files starting with `test-`

2. **Keep These Files:**
   - ✅ `index.php` (main API router)
   - ✅ `config.php` (database configuration)
   - ✅ `resident-photos.php` (photo API)
   - ✅ `resident-photos-simple.php` (can be removed if not used)
   - ✅ `residents.php` (if exists)

### Current Status:
- ✅ Local test files cleaned up
- ⚠️ Server test files need manual removal
- ✅ Core functionality working (database + photos)

**Remove the test files from your server when convenient.**