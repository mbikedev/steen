-- Supabase SQL Schema for Asylum Center Management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Residents table
CREATE TABLE residents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    badge_number INTEGER UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nationality VARCHAR(100),
    language VARCHAR(100),
    gender VARCHAR(20),
    birth_date DATE,
    registration_number VARCHAR(50),
    ov_number VARCHAR(50),
    room_number VARCHAR(10),
    reference_person VARCHAR(100),
    check_in_date DATE,
    days_stayed INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Rooms table
CREATE TABLE rooms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_number VARCHAR(10) UNIQUE NOT NULL,
    building VARCHAR(50),
    floor INTEGER,
    capacity INTEGER DEFAULT 4,
    current_occupancy INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    room_type VARCHAR(50), -- 'noord', 'zuid', 'medical', etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Kitchen/Meals schedule
CREATE TABLE meal_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
    badge_number INTEGER,
    breakfast BOOLEAN DEFAULT false,
    lunch BOOLEAN DEFAULT false,
    snack_16h BOOLEAN DEFAULT false,
    dinner BOOLEAN DEFAULT false,
    snack_21h BOOLEAN DEFAULT false,
    special_diet TEXT,
    medication_notes TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Room assignments (many-to-many relationship)
CREATE TABLE room_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    assigned_date DATE DEFAULT CURRENT_DATE,
    unassigned_date DATE,
    bed_number INTEGER,
    is_current BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Appointments/Activities
CREATE TABLE appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
    appointment_type VARCHAR(100),
    appointment_date DATE,
    appointment_time TIME,
    location VARCHAR(200),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for better performance
CREATE INDEX idx_residents_badge ON residents(badge_number);
CREATE INDEX idx_residents_room ON residents(room_number);
CREATE INDEX idx_residents_status ON residents(status);
CREATE INDEX idx_rooms_available ON rooms(is_available);
CREATE INDEX idx_room_assignments_current ON room_assignments(is_current);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_resident ON appointments(resident_id);

-- Create views for common queries
CREATE VIEW current_room_occupancy AS
SELECT 
    r.room_number,
    r.building,
    r.capacity,
    COUNT(ra.resident_id) as current_occupancy,
    r.capacity - COUNT(ra.resident_id) as available_beds
FROM rooms r
LEFT JOIN room_assignments ra ON r.id = ra.room_id AND ra.is_current = true
GROUP BY r.id, r.room_number, r.building, r.capacity;

CREATE VIEW resident_details AS
SELECT 
    r.*,
    rm.room_number as assigned_room,
    rm.building,
    ms.breakfast,
    ms.lunch,
    ms.dinner,
    ms.special_diet,
    ms.medication_notes
FROM residents r
LEFT JOIN room_assignments ra ON r.id = ra.resident_id AND ra.is_current = true
LEFT JOIN rooms rm ON ra.room_id = rm.id
LEFT JOIN meal_schedules ms ON r.id = ms.resident_id AND ms.date = CURRENT_DATE;

-- Row Level Security (RLS)
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication setup)
CREATE POLICY "Enable read access for authenticated users" ON residents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON residents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON residents
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Repeat policies for other tables...

-- Function to update room occupancy
CREATE OR REPLACE FUNCTION update_room_occupancy()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_current = true THEN
        UPDATE rooms 
        SET current_occupancy = current_occupancy + 1,
            is_available = CASE WHEN current_occupancy + 1 >= capacity THEN false ELSE true END
        WHERE id = NEW.room_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_current = true AND NEW.is_current = false THEN
        UPDATE rooms 
        SET current_occupancy = GREATEST(0, current_occupancy - 1),
            is_available = true
        WHERE id = OLD.room_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_room_occupancy_trigger
AFTER INSERT OR UPDATE ON room_assignments
FOR EACH ROW EXECUTE FUNCTION update_room_occupancy();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_residents_updated_at BEFORE UPDATE ON residents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meal_schedules_updated_at BEFORE UPDATE ON meal_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_assignments_updated_at BEFORE UPDATE ON room_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();