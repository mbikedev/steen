-- Clean residents table schema
-- Only the fields actually used by your application

DROP TABLE IF EXISTS residents CASCADE;

CREATE TABLE residents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('M', 'V')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  admission_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_residents_status ON residents(status);
CREATE INDEX idx_residents_created_at ON residents(created_at);
CREATE INDEX idx_residents_name ON residents(first_name, last_name);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_residents_updated_at 
    BEFORE UPDATE ON residents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE residents ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated users to read, insert, update, delete
CREATE POLICY "Allow all operations for everyone" ON residents
  FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON residents TO anon, authenticated;

COMMENT ON TABLE residents IS 'Clean residents table with only necessary fields';