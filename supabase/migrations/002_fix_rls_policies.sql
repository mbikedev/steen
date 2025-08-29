-- Fix RLS policies to allow all operations for testing
-- Remove existing restrictive policies and add permissive ones

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.residents;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.accommodations;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.beds;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.kitchen_list;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.permissions;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.data_match;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.noord_section;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.zuid_section;

-- Create more permissive policies for development
-- WARNING: These are for development only, use more restrictive policies in production

-- Allow all operations on residents table
CREATE POLICY "Allow all operations on residents" ON public.residents
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on data_match table
CREATE POLICY "Allow all operations on data_match" ON public.data_match
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on accommodations table
CREATE POLICY "Allow all operations on accommodations" ON public.accommodations
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on beds table
CREATE POLICY "Allow all operations on beds" ON public.beds
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on appointments table
CREATE POLICY "Allow all operations on appointments" ON public.appointments
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on kitchen_list table
CREATE POLICY "Allow all operations on kitchen_list" ON public.kitchen_list
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on permissions table
CREATE POLICY "Allow all operations on permissions" ON public.permissions
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on noord_section table
CREATE POLICY "Allow all operations on noord_section" ON public.noord_section
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on zuid_section table
CREATE POLICY "Allow all operations on zuid_section" ON public.zuid_section
    FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on activity_log table
CREATE POLICY "Allow all operations on activity_log" ON public.activity_log
    FOR ALL USING (true) WITH CHECK (true);

-- Update user_profiles policies to be more permissive
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Allow all operations on user_profiles" ON public.user_profiles
    FOR ALL USING (true) WITH CHECK (true);