# Deploy Staff Assignments API to Hostinger

## Issue
- Frontend reports "✅ Database save successful: undefined"
- No data is actually stored in `staff_assignments` table
- Remote API server missing `staff-assignments` endpoint

## Files to Upload

### 1. Updated API Router
**File**: `/api/php/index.php`
**What changed**: Added `staff-assignments` endpoint

**Line to add around line 36:**
```php
case 'staff-assignments':
    include 'staff-assignments.php';
    break;
```

**And update endpoints list around line 66:**
```php
'staff-assignments' => 'index.php?endpoint=staff-assignments',
```

### 2. New Staff Assignments API
**File**: `/api/php/staff-assignments.php` (NEW FILE)
**Upload the entire file from local project**

### 3. Database Table Check
Ensure the `staff_assignments` table exists with correct schema:

```sql
-- Check if table exists
SHOW TABLES LIKE 'staff_assignments';

-- If missing, create it:
CREATE TABLE IF NOT EXISTS `staff_assignments` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `resident_id` INT(11) NOT NULL,
    `staff_name` VARCHAR(100) NOT NULL,
    `assignment_date` DATE NOT NULL,
    `assignment_type` ENUM('meerderjarig', 'leeftijdstwijfel', 'transfer', 'regular') DEFAULT 'regular',
    `color_code` VARCHAR(20) DEFAULT 'white',
    `position_row` INT(2) DEFAULT NULL,
    `position_col` INT(2) DEFAULT NULL,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`resident_id`) REFERENCES `residents`(`id`) ON DELETE CASCADE,
    INDEX `idx_staff_name` (`staff_name`),
    INDEX `idx_assignment_date` (`assignment_date`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Deployment Steps

### Via Hostinger File Manager:

1. **Login to Hostinger hPanel**
2. **Go to Files → File Manager**
3. **Navigate to** `public_html/api/php/`

4. **Upload/Replace files:**
   - Replace `index.php` with updated version
   - Upload new `staff-assignments.php`

5. **Check database:**
   - Go to **Databases → phpMyAdmin**
   - Select database: `u734544155_mikaty`
   - Run the table creation SQL if needed

### Test Deployment:

```bash
curl -X GET "https://mikaty.eastatwest.com/api/php/index.php?endpoint=staff-assignments" \
  -H "X-Api-Key: 20a33dfcc5ba2c2bfebec361a1c1d2e167462a7b00443f8b8181bf07d9a6c50a"
```

**Expected response:**
```json
{
    "success": true,
    "data": {
        "assignments": [],
        "staff_summary": [],
        "assignment_date": "2025-09-02",
        "total_assignments": 0
    }
}
```

**Current response (before deployment):**
```json
{
    "success": true,
    "message": "Steen API is running",
    "endpoints": {
        "test-connection": "index.php?endpoint=test-connection",
        "residents": "index.php?endpoint=residents"
    }
}
```

## After Deployment

Once deployed, the "Save to DB" button will:
1. ✅ Connect to real database
2. ✅ Store assignments in `staff_assignments` table
3. ✅ Return proper success data with assignment counts
4. ✅ Enable multi-device data sharing

## Quick Deploy Alternative

If you can't deploy right now, the system will continue working with localStorage backup:
- Data is preserved locally
- Can be imported to database later
- No functionality is lost

## Priority: HIGH 🔥
Without deployment, assignments only exist in localStorage and cannot be shared between devices or users.