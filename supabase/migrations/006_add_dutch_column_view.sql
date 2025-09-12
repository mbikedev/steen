-- Create a view with Dutch column names for CSV import compatibility
CREATE OR REPLACE VIEW residents_dutch_headers AS
SELECT 
    id,
    badge AS "Externe referentie",
    last_name AS "Achternaam",
    first_name AS "Voornaam", 
    room AS "Wooneenheid",
    nationality AS "Nationaliteit",
    ov_number AS "OV Nummer",
    register_number AS "Nationaal Nummer",
    date_of_birth AS "Geboortedatum",
    age AS "Leeftijd",
    CASE 
        WHEN gender = 'M' THEN 'Mannelijk'
        WHEN gender = 'F' THEN 'Vrouwelijk' 
        ELSE gender 
    END AS "Geslacht",
    reference_person AS "Referent",
    date_in AS "Aankomstdatum",
    date_out,
    days_of_stay,
    status,
    remarks,
    room_remarks,
    photo_url,
    language,
    created_at,
    updated_at
FROM residents;

-- Create a function to insert via Dutch headers
CREATE OR REPLACE FUNCTION insert_resident_dutch(
    externe_referentie INTEGER,
    achternaam VARCHAR(100),
    voornaam VARCHAR(100), 
    wooneenheid VARCHAR(20) DEFAULT NULL,
    nationaliteit VARCHAR(100) DEFAULT NULL,
    ov_nummer VARCHAR(50) DEFAULT NULL,
    nationaal_nummer VARCHAR(50) DEFAULT NULL,
    geboortedatum DATE DEFAULT NULL,
    leeftijd INTEGER DEFAULT NULL,
    geslacht VARCHAR(20) DEFAULT NULL,
    referent VARCHAR(200) DEFAULT NULL,
    aankomstdatum DATE DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    resident_id INTEGER;
    mapped_gender CHAR(1);
BEGIN
    -- Map Dutch gender to database format
    mapped_gender := CASE 
        WHEN LOWER(geslacht) IN ('mannelijk', 'm', 'man') THEN 'M'
        WHEN LOWER(geslacht) IN ('vrouwelijk', 'v', 'vrouw', 'f') THEN 'F'
        ELSE 'M' -- default to male if unclear
    END;
    
    INSERT INTO residents (
        badge,
        last_name,
        first_name,
        room,
        nationality,
        ov_number,
        register_number,
        date_of_birth,
        age,
        gender,
        reference_person,
        date_in,
        status
    ) VALUES (
        externe_referentie,
        achternaam,
        voornaam,
        wooneenheid,
        nationaliteit,
        ov_nummer,
        nationaal_nummer,
        geboortedatum,
        leeftijd,
        mapped_gender,
        referent,
        aankomstdatum,
        'active'
    ) RETURNING id INTO resident_id;
    
    RETURN resident_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for the view
ALTER VIEW residents_dutch_headers ENABLE ROW LEVEL SECURITY;

-- Create policy for the view
CREATE POLICY "Enable all operations for authenticated users" ON residents_dutch_headers
    FOR ALL USING (auth.role() = 'authenticated');
