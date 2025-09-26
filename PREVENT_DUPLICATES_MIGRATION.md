# Prevent Duplicates in Toewijzingen Tables

This migration adds unique constraints to prevent duplicate entries in both `toewijzingen_grid` and `toewijzingen_staff` tables.

## 🎯 What This Fixes

- **Prevents duplicate grid positions**: No more duplicate entries for the same date, row, and column in `toewijzingen_grid`
- **Prevents duplicate staff positions**: No more duplicate staff assigned to same position on same date
- **Prevents duplicate staff names**: Same person can't be assigned to multiple positions on same date
- **Improves data integrity**: Database ensures consistency automatically
- **Graceful error handling**: API routes handle constraint violations properly

## 📋 Migration Details

### File: `supabase/migrations/20250925_prevent_toewijzingen_duplicates.sql`

### Constraints Added:

#### `toewijzingen_grid` table:
- `unique_grid_position_per_date`: Prevents multiple entries for same (assignment_date, row_index, col_index)

#### `toewijzingen_staff` table:
- `unique_staff_position_per_date`: Prevents multiple staff for same (assignment_date, staff_index)
- `unique_staff_name_per_date`: Prevents same person assigned to multiple positions on same date

### Performance Indexes:
- `idx_toewijzingen_grid_date_position`: Improves query performance for grid lookups
- `idx_toewijzingen_staff_date_position`: Improves query performance for staff position lookups
- `idx_toewijzingen_staff_date_name`: Improves query performance for staff name lookups

## 🚀 How to Apply

### Option 1: Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `supabase/migrations/20250925_prevent_toewijzingen_duplicates.sql`
4. Click "Run" to execute the migration

### Option 2: Supabase CLI (if you have it configured)
```bash
supabase migration up --include-all
```

## ✅ API Improvements

The following API routes have been updated to handle constraint violations gracefully:

### `/api/toewijzingen/grid` 
- **Improved upsert logic**: Better handling of unique constraint fields
- **Duplicate detection**: Automatically updates existing records instead of failing
- **Error handling**: Detects PostgreSQL error code 23505 (unique violation)

### `/api/toewijzingen/staff`
- **Enhanced POST/PUT methods**: Proper handling of staff position and name constraints
- **Conflict resolution**: Updates existing records when duplicates are detected
- **Clear error messages**: Returns 409 status with meaningful error messages

## 🧪 Testing the Migration

After applying the migration, test the following scenarios:

### Test 1: Grid Duplicate Prevention
```javascript
// This should update the existing record, not create a duplicate
const payload1 = {
  assignment_date: '2025-09-25',
  row_index: 1,
  col_index: 1,
  resident_full_name: 'John Doe'
};

const payload2 = {
  assignment_date: '2025-09-25', // Same date
  row_index: 1,                  // Same row
  col_index: 1,                  // Same column
  resident_full_name: 'Jane Doe' // Different name - should update
};
```

### Test 2: Staff Position Prevention
```javascript
// This should update the existing record, not create a duplicate
const staff1 = {
  assignment_date: '2025-09-25',
  staff_index: 1,
  staff_name: 'Alice Smith'
};

const staff2 = {
  assignment_date: '2025-09-25', // Same date
  staff_index: 1,                // Same position
  staff_name: 'Bob Johnson'      // Different person - should update
};
```

### Test 3: Staff Name Prevention
```javascript
// This should fail with a 409 error (same person, different position)
const staff1 = {
  assignment_date: '2025-09-25',
  staff_index: 1,
  staff_name: 'Alice Smith'
};

const staff2 = {
  assignment_date: '2025-09-25', // Same date
  staff_index: 2,                // Different position
  staff_name: 'Alice Smith'      // Same person - should fail
};
```

## 📊 Expected Results

After applying this migration:

1. ✅ **Database integrity**: No duplicate entries possible
2. ✅ **Automatic updates**: Duplicate attempts become updates
3. ✅ **Clear error messages**: Meaningful feedback for constraint violations
4. ✅ **Performance**: Optimized indexes for faster queries
5. ✅ **Data consistency**: Reliable data structure across all operations

## 🔧 Rollback (if needed)

If you need to rollback this migration:

```sql
-- Remove constraints
ALTER TABLE toewijzingen_grid DROP CONSTRAINT IF EXISTS unique_grid_position_per_date;
ALTER TABLE toewijzingen_staff DROP CONSTRAINT IF EXISTS unique_staff_position_per_date;
ALTER TABLE toewijzingen_staff DROP CONSTRAINT IF EXISTS unique_staff_name_per_date;

-- Remove indexes
DROP INDEX IF EXISTS idx_toewijzingen_grid_date_position;
DROP INDEX IF EXISTS idx_toewijzingen_staff_date_position;
DROP INDEX IF EXISTS idx_toewijzingen_staff_date_name;
```

## 🎉 Benefits

- **Data Quality**: Ensures clean, consistent data
- **User Experience**: No more unexpected duplicate entries
- **Performance**: Optimized database queries
- **Reliability**: Database-level constraints prevent inconsistencies
- **Debugging**: Clear error messages help identify issues

This migration significantly improves the reliability and data integrity of your Toewijzingen system!