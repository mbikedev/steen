-- Minimal migration to create only essential tables for the app
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Residents table (main table needed)
CREATE TABLE IF NOT EXISTS public.residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('M', 'V', 'male', 'female', 'other')),
    phone TEXT,
    email TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
    admission_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Match table (main table for the data-match-it page)
CREATE TABLE IF NOT EXISTS public.data_match (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
    external_id TEXT,
    external_system TEXT DEFAULT 'legacy_system',
    match_status TEXT CHECK (match_status IN ('matched', 'pending', 'unmatched', 'conflict')) DEFAULT 'matched',
    sync_status TEXT CHECK (sync_status IN ('success', 'failed', 'pending')) DEFAULT 'success',
    data_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Accommodations table (for rooms)
CREATE TABLE IF NOT EXISTS public.accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number TEXT UNIQUE NOT NULL,
    building TEXT,
    capacity INTEGER DEFAULT 4,
    status TEXT CHECK (status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Beds table (for bed assignments)
CREATE TABLE IF NOT EXISTS public.beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accommodation_id UUID REFERENCES public.accommodations(id) ON DELETE CASCADE,
    bed_number TEXT NOT NULL,
    status TEXT CHECK (status IN ('available', 'occupied', 'maintenance')) DEFAULT 'available',
    resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
    location TEXT CHECK (location IN ('noord', 'zuid', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_match ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for development (allow all operations)
CREATE POLICY "Allow all operations on residents" ON public.residents
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on data_match" ON public.data_match
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on accommodations" ON public.accommodations
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on beds" ON public.beds
    FOR ALL USING (true) WITH CHECK (true);