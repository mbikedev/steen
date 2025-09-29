# 🚨 URGENT: Database Migrations Required

## Current Issue
The application is encountering repeated errors because several database migrations haven't been applied:

```
"Could not find the 'language' column of 'residents' in the schema cache"
```

## What I've Fixed (Temporary)
✅ Updated `api-service.ts` to handle missing language column gracefully
✅ Added proper retry logic for database errors
✅ Fixed TypeScript errors in updateResident method

## What Still Needs to Be Done (URGENT)
🔴 **Apply database migrations** - The following migrations need to be run in order:

1. `007_add_language_column.sql` - Adds missing language column
2. `008_fix_column_lengths.sql` - Fixes column length constraints  
3. `009_create_toewijzingen_staff_table.sql` - Creates missing table for Toewijzingen page
4. `010_fix_toewijzingen_grid_rls.sql` - Fixes Row Level Security policies
5. `006_add_dutch_column_view.sql` - Creates Dutch header view for CSV imports

## How to Apply Migrations

### Quick Fix (Supabase Dashboard)
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the content of each migration file (in the order above)
3. Run each one by clicking "Run"

### Alternative (CLI)
```bash
cd /Users/mbike/Documents/steen-main2
supabase db push
```

## Impact Without Migrations
- ❌ Cannot add new residents (language column error)
- ❌ CSV import fails due to header mismatch
- ❌ Toewijzingen page data doesn't persist
- ❌ Potential data truncation errors

## After Migrations Applied
- ✅ All resident operations will work normally
- ✅ CSV imports with Dutch headers will work  
- ✅ Toewijzingen page will save data properly
- ✅ No more database constraint errors

**The temporary fixes in the code will continue to work as fallbacks, but the migrations are the proper long-term solution.**