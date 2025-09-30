# 🔍 DEBUG: Toewijzingen Data Persistence Issue

## Problem
Toewijzingen page cell data (resident names) are not being saved to the `toewijzingen_grid` database table, causing data to disappear on page refresh.

## Enhanced Debugging Added

### What I've Added to Help Diagnose the Issue:

#### 1. **Page-Level Debugging** (`app/dashboard/toewijzingen/page.tsx`)
- ✅ Added detailed logging when save is triggered
- ✅ Shows exactly what data is being saved
- ✅ Displays staff names, assignment count, and cell data
- ✅ Shows which cells contain resident names

#### 2. **API-Level Debugging** (`lib/api-service.ts`)
- ✅ Added table existence verification before save
- ✅ Enhanced logging for database operations
- ✅ Shows exactly what data is sent to database
- ✅ Displays database response and any errors
- ✅ Added test function to verify table accessibility

#### 3. **Database Operation Monitoring**
- ✅ Logs each batch of data being saved
- ✅ Shows successful vs failed records
- ✅ Displays actual database insertion results
- ✅ Enhanced error reporting with full details

## How to Debug This Issue

### Step 1: Open Browser Console
1. Go to Toewijzingen page
2. Open Browser Developer Tools (F12)
3. Go to Console tab

### Step 2: Add Some Data and Watch Logs
1. Add a resident name to any cell in the grid
2. Wait 2 seconds for auto-save to trigger
3. Look for these log messages:

#### ✅ **SUCCESS INDICATORS** (What you should see):
```
🔍 DEBUG Save Data: {assignmentDate: "2024-XX-XX", staffNames: [...], assignmentCount: X}
✅ Database tables verified and accessible
✅ Cleared existing grid data for date: 2024-XX-XX
📝 Grid Cell 1: {assignment_date: "2024-XX-XX", row_index: X, col_index: X, resident_full_name: "Name"}
✅ Grid batch saved successfully: X records
✅ Saved to database: X cells, X staff records
```

#### ❌ **ERROR INDICATORS** (What suggests problems):
```
🚨 Database tables not accessible: [error message]
❌ Database error in grid batch: [error details]
❌ toewijzingen_grid table test failed: [error]
❌ Exception in grid batch save: [error]
```

### Step 3: Test Page Refresh
1. After adding data and seeing successful save logs
2. Refresh the page
3. Look for these logs:

#### ✅ **DATA LOADING SUCCESS**:
```
📥 getToewijzingenGrid: Found X records for date 2024-XX-XX
✅ Found data - Grid cells: X, Staff records: X
```

#### ❌ **DATA LOADING PROBLEMS**:
```
📥 getToewijzingenGrid: Found 0 records for date 2024-XX-XX
🚨 URGENT: toewijzingen_grid table does not exist!
ℹ️ No assignment data found for 2024-XX-XX
```

## Most Likely Issues & Solutions

### Issue 1: Database Tables Don't Exist
**Error**: `relation "public.toewijzingen_grid" does not exist`
**Solution**: Apply migrations 009 and 010 from Supabase dashboard

### Issue 2: RLS Policies Block Saves
**Error**: `new row violates row-level security policy`
**Solution**: Apply migration 010 to fix RLS policies

### Issue 3: Authentication Issues
**Error**: `Not authenticated - please log in`
**Solution**: Check if user is properly authenticated or if anonymous access is configured

### Issue 4: Data Format Issues
**Error**: Database accepts data but shows 0 records
**Solution**: Check the console logs to see if data structure is correct

## Migration Check

If you see table existence errors, you need to apply these migrations in Supabase Dashboard:

1. **Migration 009**: Creates `toewijzingen_staff` table
2. **Migration 010**: Fixes RLS policies for `toewijzingen_grid`

## Testing the Fix

### Manual Test Procedure:
1. Open Toewijzingen page with console open
2. Add resident name to a cell
3. Check console for success/error messages
4. Wait for auto-save (2 seconds)
5. Refresh page
6. Verify data persists

### Expected Console Flow:
```
🏁 Toewijzingen page component loaded
📥 Loading toewijzingen data for date: 2024-XX-XX
📥 getToewijzingenGrid: Found 0 records (first time)
📝 Cell data updated, triggering auto-save
💾 Calling toewijzingenGridApi.saveGrid...
✅ Database tables verified and accessible
✅ Grid batch saved successfully: 1 records
✅ Auto-saved: 1 cells, 1 staff records

[After refresh]
📥 getToewijzingenGrid: Found 1 records for date 2024-XX-XX
✅ Found data - Grid cells: 1, Staff records: 1
```

## Next Steps

1. **Test with enhanced debugging** - Add resident names and check console
2. **Report specific error messages** - Share any red error messages from console
3. **Verify migrations applied** - Ensure database tables exist
4. **Check authentication** - Verify user can access database

**The enhanced debugging will tell us exactly what's going wrong and where!**
