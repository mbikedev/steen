# Toewijzingen Data Persistence Fix

## Problem
Toewijzingen page data was not persisting after page refresh. All assignment data would be lost when the user refreshed the browser or navigated away and back to the page.

## Root Cause
The issue was caused by missing database infrastructure:

1. **Missing `toewijzingen_staff` table**: The code was trying to save staff assignment data to a table that didn't exist
2. **Incomplete RLS policies**: The `toewijzingen_grid` table lacked UPDATE and DELETE policies for anonymous users
3. **Database operations failing silently**: When the save operations failed, the app fell back to localStorage which doesn't persist across page refreshes in this implementation

## Solution Applied

### 1. Created `toewijzingen_staff` Table (Migration 009)
- **File**: `supabase/migrations/009_create_toewijzingen_staff_table.sql`
- **Purpose**: Stores staff assignment metadata (names, counts, annotations)
- **Features**:
  - Proper indexing for performance
  - RLS policies for both authenticated and anonymous users
  - Automatic `updated_at` timestamp tracking
  - Unique constraint on (assignment_date, staff_index)

### 2. Fixed `toewijzingen_grid` RLS Policies (Migration 010)
- **File**: `supabase/migrations/010_fix_toewijzingen_grid_rls.sql`
- **Purpose**: Allow client-side CRUD operations on grid data
- **Changes**:
  - Added UPDATE policy for anonymous users
  - Added DELETE policy for anonymous users
  - Made optional fields truly nullable

### 3. Existing Infrastructure
The following was already in place:
- `toewijzingen_grid` table (from migrations 002, 003)
- Complete API service methods (`toewijzingenGridApi`)
- Auto-save functionality in the Toewijzingen page component

## How Data Persistence Works Now

### Data Flow
1. **User edits assignment**: Cell data is updated in React state
2. **Auto-save triggers**: 2-second debounced auto-save activates
3. **Database save**: Data is saved to both `toewijzingen_grid` and `toewijzingen_staff` tables
4. **Page refresh**: Data is automatically loaded from database on component mount

### Database Schema

#### `toewijzingen_grid` Table
```sql
CREATE TABLE toewijzingen_grid (
    id SERIAL PRIMARY KEY,
    assignment_date DATE NOT NULL,
    row_index INTEGER NOT NULL,
    col_index INTEGER NOT NULL,
    resident_full_name VARCHAR(200),
    ib_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_date, row_index, col_index)
);
```

#### `toewijzingen_staff` Table
```sql
CREATE TABLE toewijzingen_staff (
    id SERIAL PRIMARY KEY,
    assignment_date DATE NOT NULL,
    staff_name VARCHAR(100) NOT NULL,
    staff_index INTEGER NOT NULL,
    assignment_count INTEGER DEFAULT 0,
    annotations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_date, staff_index)
);
```

## Features After Fix

### ✅ **Auto-Save Functionality**
- Saves changes automatically 2 seconds after user stops editing
- Visual indicator shows auto-save status
- Can be toggled on/off by user

### ✅ **Data Persistence**
- All assignment data persists across page refreshes
- Data is tied to specific assignment dates
- Historical assignments can be retrieved by date

### ✅ **Real-Time Updates**
- Staff assignment counts update automatically
- Referentiepersoon field in residents is synced with assignments
- Color coding preserved (meerderjarig, leeftijdstwijfel, transfer)

### ✅ **Error Handling**
- Graceful fallback if database is unavailable
- User feedback for save success/failure
- Detailed error logging for debugging

## Testing the Fix

### Before Applying Migrations
1. Go to Toewijzingen page
2. Add some resident assignments
3. Refresh page → **Data disappears** ❌

### After Applying Migrations
1. Go to Toewijzingen page  
2. Add some resident assignments
3. Wait for auto-save confirmation
4. Refresh page → **Data persists** ✅

## Migration Instructions

Run these migrations in your Supabase dashboard:

1. `007_add_language_column.sql` (if not already applied)
2. `008_fix_column_lengths.sql` (if not already applied)  
3. **`009_create_toewijzingen_staff_table.sql`** ← **New for this fix**
4. **`010_fix_toewijzingen_grid_rls.sql`** ← **New for this fix**
5. `006_add_dutch_column_view.sql` (if not already applied)

See `APPLY_DUTCH_HEADERS_MIGRATION.md` for detailed migration instructions.
