-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'staff', 'resident', 'viewer')),
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Residents table
CREATE TABLE IF NOT EXISTS public.residents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('M', 'V', 'male', 'female', 'other')),
    phone TEXT,
    email TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_notes TEXT,
    dietary_restrictions TEXT,
    status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'active',
    admission_date DATE,
    discharge_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Accommodations/Rooms table
CREATE TABLE IF NOT EXISTS public.accommodations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_number TEXT UNIQUE NOT NULL,
    building TEXT,
    floor INTEGER,
    room_type TEXT CHECK (room_type IN ('single', 'double', 'suite', 'ward')),
    capacity INTEGER DEFAULT 1,
    current_occupancy INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')) DEFAULT 'available',
    amenities JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bed Management table
CREATE TABLE IF NOT EXISTS public.beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    accommodation_id UUID REFERENCES public.accommodations(id) ON DELETE CASCADE,
    bed_number TEXT NOT NULL,
    bed_type TEXT CHECK (bed_type IN ('standard', 'adjustable', 'hospital', 'special')),
    status TEXT CHECK (status IN ('available', 'occupied', 'maintenance', 'reserved')) DEFAULT 'available',
    resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
    location TEXT CHECK (location IN ('noord', 'zuid', 'other')),
    notes TEXT,
    last_cleaned TIMESTAMPTZ,
    next_maintenance DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(accommodation_id, bed_number)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
    appointment_type TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    location TEXT,
    provider_name TEXT,
    provider_type TEXT,
    status TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show')) DEFAULT 'scheduled',
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Kitchen List (Keukenlijst) table
CREATE TABLE IF NOT EXISTS public.kitchen_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    breakfast BOOLEAN DEFAULT FALSE,
    lunch BOOLEAN DEFAULT FALSE,
    dinner BOOLEAN DEFAULT FALSE,
    special_diet TEXT,
    allergies TEXT,
    preferences TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resident_id, meal_date)
);

-- Permission List (Permissielijst) table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
    permission_type TEXT NOT NULL,
    granted_by UUID REFERENCES auth.users(id),
    granted_date DATE NOT NULL,
    expiry_date DATE,
    status TEXT CHECK (status IN ('active', 'expired', 'revoked')) DEFAULT 'active',
    reason TEXT,
    restrictions TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Match IT table (for integration/matching)
CREATE TABLE IF NOT EXISTS public.data_match (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
    external_id TEXT,
    external_system TEXT,
    match_status TEXT CHECK (match_status IN ('matched', 'pending', 'unmatched', 'conflict')) DEFAULT 'pending',
    match_confidence DECIMAL(3,2) CHECK (match_confidence >= 0 AND match_confidence <= 1),
    last_sync TIMESTAMPTZ,
    sync_status TEXT CHECK (sync_status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
    data_payload JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Noord section specific data
CREATE TABLE IF NOT EXISTS public.noord_section (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
    bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
    section_status TEXT CHECK (section_status IN ('active', 'transferred', 'discharged')) DEFAULT 'active',
    care_level TEXT,
    care_team TEXT,
    daily_routine JSONB,
    special_requirements TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resident_id)
);

-- Zuid section specific data
CREATE TABLE IF NOT EXISTS public.zuid_section (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
    bed_id UUID REFERENCES public.beds(id) ON DELETE SET NULL,
    section_status TEXT CHECK (section_status IN ('active', 'transferred', 'discharged')) DEFAULT 'active',
    care_level TEXT,
    care_team TEXT,
    daily_routine JSONB,
    special_requirements TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resident_id)
);

-- Activity Log table (for tracking changes)
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_residents_status ON public.residents(status);
CREATE INDEX idx_residents_admission_date ON public.residents(admission_date);
CREATE INDEX idx_beds_status ON public.beds(status);
CREATE INDEX idx_beds_location ON public.beds(location);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_resident ON public.appointments(resident_id);
CREATE INDEX idx_kitchen_list_date ON public.kitchen_list(meal_date);
CREATE INDEX idx_permissions_resident ON public.permissions(resident_id);
CREATE INDEX idx_permissions_status ON public.permissions(status);
CREATE INDEX idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON public.residents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accommodations_updated_at BEFORE UPDATE ON public.accommodations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON public.beds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kitchen_list_updated_at BEFORE UPDATE ON public.kitchen_list
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_permissions_updated_at BEFORE UPDATE ON public.permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_match_updated_at BEFORE UPDATE ON public.data_match
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_noord_section_updated_at BEFORE UPDATE ON public.noord_section
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zuid_section_updated_at BEFORE UPDATE ON public.zuid_section
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_match ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noord_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zuid_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your requirements)
-- Allow authenticated users to view data
CREATE POLICY "Allow authenticated read access" ON public.residents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.accommodations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.beds
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.appointments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.kitchen_list
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.permissions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.data_match
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.noord_section
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated read access" ON public.zuid_section
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Activity log: users can only view their own activities
CREATE POLICY "Users can view own activities" ON public.activity_log
    FOR SELECT USING (auth.uid() = user_id);

-- Note: Add more granular policies based on roles (admin, staff, etc.) as needed