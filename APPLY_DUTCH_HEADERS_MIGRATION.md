# Apply Database Fixes

## Problem 1: Missing Language Column
The `language` column is missing from your residents table, causing errors when adding residents.

## Problem 2: Column Length Constraints  
Some fields are too short (room limited to 20 chars) causing "value too long" errors.

## Problem 3: CSV Import Headers  
CSV import fails because it expects Dutch column headers but the database uses English field names.

## Solution
Run all three migrations to fix the database structure and add compatibility.

## Steps to Apply Migrations

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. **FIRST**: Copy and paste the contents of `supabase/migrations/007_add_language_column.sql`
4. Click "Run" to execute
5. **SECOND**: Copy and paste the contents of `supabase/migrations/008_fix_column_lengths.sql`
6. Click "Run" to execute
7. **THIRD**: Copy and paste the contents of `supabase/migrations/006_add_dutch_column_view.sql`  
8. Click "Run" to execute

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
-- THIRD: Copy the entire contents of 006_add_dutch_column_view.sql here
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
