# Apply Database Fixes

## Problem 1: Missing Language Column
The `language` column is missing from your residents table, causing errors when adding residents.

## Problem 2: Column Length Constraints  
Some fields are too short (room limited to 20 chars) causing "value too long" errors.

## Problem 3: CSV Import Headers  
CSV import fails because it expects Dutch column headers but the database uses English field names.

## Problem 4: Toewijzingen Data Not Persisting
Toewijzingen page data disappears on page refresh because the `toewijzingen_staff` table is missing and RLS policies need fixes.

## Solution
Run all five migrations to fix the database structure and add full compatibility.

## Steps to Apply Migrations

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. **STEP 1**: Copy and paste the contents of `supabase/migrations/007_add_language_column.sql`
4. Click "Run" to execute
5. **STEP 2**: Copy and paste the contents of `supabase/migrations/008_fix_column_lengths.sql`
6. Click "Run" to execute
7. **STEP 3**: Copy and paste the contents of `supabase/migrations/009_create_toewijzingen_staff_table.sql`
8. Click "Run" to execute
9. **STEP 4**: Copy and paste the contents of `supabase/migrations/010_fix_toewijzingen_grid_rls.sql`
10. Click "Run" to execute
11. **STEP 5**: Copy and paste the contents of `supabase/migrations/006_add_dutch_column_view.sql`  
12. Click "Run" to execute

**IMPORTANT**: Run all 5 migrations in this exact order. Each one is needed for different functionality.

### Option 2: Via Supabase CLI
```bash
cd /Users/mbike/Documents/steen-main2
supabase db push
```

### Option 3: Manual SQL Execution
Connect to your database using the password you provided and run:
```sql
-- FIRST: Copy the entire contents of 007_add_language_column.sql here
-- SECOND: Copy the entire contents of 008_fix_column_lengths.sql here  
-- THIRD: Copy the entire contents of 009_create_toewijzingen_staff_table.sql here
-- FOURTH: Copy the entire contents of 010_fix_toewijzingen_grid_rls.sql here
-- FIFTH: Copy the entire contents of 006_add_dutch_column_view.sql here
```

## After Migration

### For CSV Import Tools
You can now import CSV files with Dutch headers by targeting the `residents_dutch_headers` view instead of the `residents` table.

### For App Usage
Your DATA-MATCH-IT page will continue to work exactly as before - no changes needed there.

## Column Mapping
The view provides these Dutch aliases:
- `badge` → "Externe referentie" 
- `last_name` → "Achternaam"
- `first_name` → "Voornaam"
- `room` → "Wooneenheid" 
- `nationality` → "Nationaliteit"
- `ov_number` → "OV Nummer"
- `register_number` → "Nationaal Nummer"
- `date_of_birth` → "Geboortedatum"
- `age` → "Leeftijd"
- `gender` → "Geslacht" (with automatic M/F to Mannelijk/Vrouwelijk conversion)
- `reference_person` → "Referent"
- `date_in` → "Aankomstdatum"
