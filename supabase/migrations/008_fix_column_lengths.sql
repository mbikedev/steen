-- Fix column length constraints in residents table

-- Increase room column size from 20 to 50 characters
ALTER TABLE residents ALTER COLUMN room TYPE VARCHAR(50);

-- Increase ov_number column size from 50 to 100 characters (for longer ID numbers)
ALTER TABLE residents ALTER COLUMN ov_number TYPE VARCHAR(100);

-- Increase register_number column size from 50 to 100 characters (for longer national ID numbers)
ALTER TABLE residents ALTER COLUMN register_number TYPE VARCHAR(100);

-- Increase reference_person column size from 200 to 300 characters (for longer names)
ALTER TABLE residents ALTER COLUMN reference_person TYPE VARCHAR(300);

-- Add comments to document the changes
COMMENT ON COLUMN residents.room IS 'Room number or unit identifier (max 50 chars)';
COMMENT ON COLUMN residents.ov_number IS 'OV transport number or similar ID (max 100 chars)';
COMMENT ON COLUMN residents.register_number IS 'National register number or similar ID (max 100 chars)';
COMMENT ON COLUMN residents.reference_person IS 'Reference person name or contact (max 300 chars)';

-- Log the migration
INSERT INTO activity_logs (action, entity_type, details) 
VALUES ('migration', 'residents', '{"migration": "008_fix_column_lengths", "description": "Increased column lengths to accommodate longer data values"}');
