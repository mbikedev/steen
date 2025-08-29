-- Seed data for Asylum Center Database
-- Based on PDF files: Bewonerlijst, keukenlijst, rooms-noord, rooms-zuid

-- Clear existing data (optional - comment out if you want to keep existing data)
-- TRUNCATE residents, rooms, meal_schedules, room_assignments, appointments CASCADE;

-- Insert Rooms data first (from rooms-noord.pdf and rooms-zuid.pdf)
INSERT INTO rooms (room_number, building, floor, capacity, current_occupancy, is_available, room_type) VALUES
-- Noord Building - Block 1
('1.06', 'Noord', 1, 4, 4, false, 'noord'),
('1.07', 'Noord', 1, 4, 4, false, 'noord'),
('1.08', 'Noord', 1, 5, 5, false, 'noord'),
('1.09', 'Noord', 1, 5, 5, false, 'noord'),
('1.14', 'Noord', 1, 3, 0, true, 'noord'),
('1.15', 'Noord', 1, 3, 0, true, 'noord'),
('1.16', 'Noord', 1, 3, 2, true, 'noord'),
('1.17', 'Noord', 1, 3, 2, true, 'noord'),
('1.18', 'Noord', 1, 3, 1, true, 'noord'),
('1.19', 'Noord', 1, 3, 2, true, 'noord'),
-- Zuid Building - Block 2
('2.06', 'Zuid', 2, 4, 3, true, 'zuid'),
('2.07', 'Zuid', 2, 4, 2, true, 'zuid'),
('2.08', 'Zuid', 2, 5, 5, false, 'zuid'),
('2.09', 'Zuid', 2, 5, 5, false, 'zuid'),
('2.14', 'Zuid', 2, 3, 3, false, 'zuid'),
('2.15', 'Zuid', 2, 3, 3, false, 'zuid'),
('2.16', 'Zuid', 2, 3, 3, false, 'zuid'),
('2.17', 'Zuid', 2, 3, 3, false, 'zuid'),
('2.18', 'Zuid', 2, 3, 2, true, 'zuid'),
('2.19', 'Zuid', 2, 3, 0, true, 'zuid')
ON CONFLICT (room_number) DO UPDATE SET
    building = EXCLUDED.building,
    floor = EXCLUDED.floor,
    capacity = EXCLUDED.capacity,
    current_occupancy = EXCLUDED.current_occupancy,
    is_available = EXCLUDED.is_available,
    room_type = EXCLUDED.room_type;

-- Insert Residents data (from Bewonerlijst.pdf)
INSERT INTO residents (badge_number, first_name, last_name, nationality, gender, birth_date, registration_number, ov_number, room_number, reference_person, check_in_date, status, language) VALUES
(25097, 'Allan Pharel', 'Tchawou', 'Kameroen', 'Mannelijk', '2010-06-20', '10062028575', '10225755', '2.17', 'Bevers Chris', '2025-05-05', 'active', 'Frans'),
(25112, 'Mohamed', 'Cherif', 'Guinea', 'Mannelijk', '2008-09-04', '08090453788', '10236814', '2.09', 'Bevers Chris', '2025-05-15', 'active', 'Frans'),
(25113, 'Abdoul Karim', 'Conde', 'Guinée', 'Mannelijk', '2008-05-16', '8051649137', '10236653', '2.09', 'Bevers Chris', '2025-05-15', 'active', 'Frans'),
(25121, 'Ismail', 'Safi', 'Afghanistan', 'Mannelijk', '2007-09-30', '07093040501', '10239904', '2.15', 'Othman Didar', '2025-05-20', 'active', 'Pashtou'),
(25137, 'Awet Weldrufael', 'Gebremeskel', 'Eritrea', 'Mannelijk', '2009-02-10', '09021052388', '1024801', '2.18', 'Bevers Chris', '2025-06-03', 'active', 'Tigrinya'),
(25140, 'Faniel Habtay', 'Gergish', 'Eritrea', 'Mannelijk', '2010-04-05', '10040529120', '10245908', '1.08', 'Bevers Chris', '2025-05-28', 'active', 'Tigrinya'),
(25142, 'Abel Kesete', 'Tesfazghi', 'Eritrea', 'Mannelijk', '2008-01-01', '08000062557', '10248386', '1.09', 'Verhoeven Dorien', '2025-06-03', 'active', 'Tigrinya'),
(25143, 'Dinar Gebremedhin', 'Gebrehiwet', 'Ethiopië', 'Mannelijk', '2007-10-21', '07102129597', '10248613', '1.08', 'Reszczynski Evelien', '2025-06-03', 'active', 'Tigrinya'),
(25145, 'Fasil Alebacho', 'Baye', 'Ethiopië', 'Mannelijk', '2007-09-21', '07092155722', '10248640', '2.09', 'Reszczynski Evelien', '2025-06-04', 'active', 'Tigrinya'),
(25147, 'Even Fsaha', 'Araya', 'Eritrea', 'Mannelijk', '2010-01-10', '10011036962', '10253268', '2.14', 'Verhoeven Dorien', '2025-06-10', 'active', 'Tigrinya'),
(25149, 'Mekaflti Bahta', 'Teklebrhan', 'Eritrea', 'Mannelijk', '2008-03-19', '08031948338', '10252895', '2.18', 'Verhoeven Dorien', '2025-06-10', 'active', 'Tigrinya'),
(25150, 'Michael Kinfe', 'Abraha', 'Eritrea', 'Mannelijk', '2001-03-07', '01030756374', '10252866', '1.07', 'De Winter Yasmina', '2025-06-10', 'active', 'Tigrinya'),
(25152, 'Amaniel Abraham', 'Haile', 'Eritrea', 'Mannelijk', '2008-02-22', '08022246754', '10252846', '1.09', 'Verhoeven Dorien', '2025-06-10', 'active', 'Tigrinya'),
(25154, 'Merhawi Weldu', 'Haile', 'Eritrea', 'Mannelijk', '2009-05-06', '09050652533', '10252946', '1.09', 'De Winter Yasmina', '2025-06-10', 'active', 'Tigrinya'),
(25159, 'Adhanom Measho', 'Gebremaraim', 'Eritrea', 'Mannelijk', '2009-06-02', '09060251375', '10261155', '1.08', 'Verhoeven Dorien', '2025-06-17', 'active', 'Tigrinya'),
(25161, 'Michaele Tewelde', 'Habtemichael', 'Eritrea', 'Mannelijk', '2009-06-05', '09060550986', '10261120', '1.08', 'Verhoeven Dorien', '2025-06-17', 'active', 'Tigrinya'),
(25163, 'Faniel Amanuel', 'Amine', 'Eritrea', 'Mannelijk', '2008-08-20', '08082052303', '10263456', '1.07', 'Bevers Chris', '2025-06-19', 'active', 'Tigrinya'),
(25165, 'Tesfamariam Fsaha', 'Gerebrhan', 'Eritrea', 'Mannelijk', '2009-08-01', '09080138553', '10264516', '2.06', 'Bevers Chris', '2025-06-20', 'active', 'Frans'),
(25168, 'Moulion Hétu Aliyou', 'Nsangou', 'Kameroen', 'Mannelijk', '2008-06-15', '08061529972', '10266016', '2.06', 'De Winter Yasmina', '2025-06-23', 'active', 'Tigriyna'),
(25170, 'Shaheen', 'Hakimi', 'Afghanistan', 'Mannelijk', '2010-02-12', '10021253933', '10265787', '2.16', 'De Winter Yasmina', '2025-06-23', 'active', 'Tigrinya'),
(25171, 'Fazal Hadi', 'Zundai', 'Afghanistan', 'Mannelijk', '2008-06-14', '08061431190', '10265966', '2.09', 'De Winter Yasmina', '2025-06-23', 'active', 'Pashtou'),
(25172, 'Abel Mikiele', 'Lemlem', 'Eritrea', 'Mannelijk', '2008-03-12', '08031251126', '10266577', '1.07', 'Othman Didar', '2025-06-24', 'active', 'Tigriyna'),
(25173, 'Tedros Dagenew', 'Tesfay', 'Eritrea', 'Mannelijk', '2008-04-08', '08040858579', '10266543', '2.14', 'Othman Didar', '2025-06-24', 'active', 'Tigriyna'),
(25174, 'Ali Reza', 'Hussaini', 'Afghanistan', 'Mannelijk', '2008-06-09', '08060951734', '10269488', '2.16', 'Othman Didar', '2025-06-26', 'active', 'Dari'),
(25175, 'Mamadou Saliou', 'Balde', 'Guinea', 'Mannelijk', '2008-04-04', '08020449581', '10272489', '1.07', 'De Winter Yasmina', '2025-07-01', 'active', 'Frans'),
(25176, 'Mory', 'Diomande', 'Ivoorkust', 'Mannelijk', '2008-12-21', '08122130921', '10271934', '2.08', 'De Winter Yasmina', '2025-06-30', 'active', NULL),
(25177, 'Thierno Idrissa', 'Diallo', 'Guinea', 'Mannelijk', '2008-06-30', '08063054357', '10271111', '2.08', 'De Winter Yasmina', '2025-06-30', 'active', 'Dari'),
(25178, 'Suleman Omerdin', 'Suleman', 'Eritrea', 'Mannelijk', '2008-06-30', '08063054555', '10271137', '2.14', 'Othman Didar', '2025-06-30', 'active', 'Tigrinya'),
(25179, 'Said', 'Zahir', 'Afghanistan', 'Mannelijk', '2008-05-21', '08052151557', '10272302', '2.16', 'Othman Didar', '2025-07-01', 'active', 'Pashtou'),
(25180, 'Ateshim Weldegergish', 'Tesfaldet', 'Eritrea', 'Mannelijk', '2008-10-08', '08100847537', '10272321', '2.17', 'Othman Didar', '2025-07-01', 'active', 'Tigrinya'),
(25183, 'Filmon Tesfamichael', 'Girmay', 'Eritrea', 'Mannelijk', '2008-08-14', '08081459118', '10280106', '2.07', 'Imane', '2025-07-09', 'active', 'Tigriyna'),
(25184, 'Mirwais', 'Ebrahemkhil', 'Afghanistan', 'Mannelijk', '2009-02-21', '09022129781', '10280721', '2.17', 'Imane', '2025-07-09', 'active', 'Tigriyna')
ON CONFLICT (badge_number) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    nationality = EXCLUDED.nationality,
    gender = EXCLUDED.gender,
    birth_date = EXCLUDED.birth_date,
    registration_number = EXCLUDED.registration_number,
    ov_number = EXCLUDED.ov_number,
    room_number = EXCLUDED.room_number,
    reference_person = EXCLUDED.reference_person,
    check_in_date = EXCLUDED.check_in_date,
    status = EXCLUDED.status,
    language = EXCLUDED.language;

-- Additional residents from room lists not in main list
INSERT INTO residents (badge_number, first_name, last_name, nationality, gender, room_number, status, language) VALUES
(25186, 'Simon Luul', 'Teklemichael', 'Eritrea', 'Mannelijk', '2.15', 'active', 'Pashtou'),
(25188, 'Faniel Tesfaldet', 'Tewelde', 'Eritrea', 'Mannelijk', '1.08', 'active', 'Tigrinya'),
(25189, 'Selah Ali', 'Abdela', 'Eritrea', 'Mannelijk', '1.06', 'active', 'Tigriyna'),
(25190, 'Samsom Kifle', 'Tewelde', 'Eritrea', 'Mannelijk', '2.07', 'active', 'Tigriyna'),
(25192, 'Seid Abdelkhadr', 'Mohammed', 'Eritrea', 'Mannelijk', '2.06', 'active', 'Tygriyna'),
(25193, 'Samiel Gebre', 'Gerezgiher', 'Eritrea', 'Mannelijk', '2.08', 'active', 'Frans'),
(25194, 'Filmon Asfha', 'Adhanom', 'Ethiopië', 'Mannelijk', '1.06', 'active', 'Tigriyna'),
(25195, 'Merhawi Mengstu', 'Kahsay', 'Eritrea', 'Mannelijk', '1.06', 'active', 'Tigriyna'),
(25196, 'Kibrom Gebretsadkan', 'Kidanemariam', 'Eritrea', 'Mannelijk', '1.06', 'active', NULL),
(25198, 'Mirfat Issa', 'Stephen', 'Tanzania', 'Vrouwelijk', '1.16', 'active', 'Engels/Swahili'),
(25200, 'Thomas Zeray', 'Gebrezgabiher', 'Eritrea', 'Mannelijk', '1.09', 'active', 'Tigriyna'),
(25201, 'Daniel Berhe', 'Kidane', 'Eritrea', 'Mannelijk', '1.09', 'active', 'Tigriyna'),
(25202, 'Bahram', 'Behbodi', 'Afghanistan', 'Mannelijk', '2.08', 'active', 'Tigriyna'),
(25203, 'Ruta Weldeslasie', 'Sahle', 'Eritrea', 'Vrouwelijk', '1.17', 'active', 'Tigrinya'),
(24191, 'Noor Agha', 'Jabarkhel', 'Afghanistan', 'Mannelijk', '2.15', 'active', 'Tigrinya'),
(25205, 'Ahmad Zafar', 'Nazari', 'Afghanistan', 'Mannelijk', '2.08', 'active', 'Dari'),
(25206, 'Ambesajer Teklab', 'Mahtsen', 'Eritrea', 'Mannelijk', '2.09', 'active', 'Tigriyna'),
(25207, 'Saba Teklezghi', 'Teweldebrhan', 'Eritrea', 'Vrouwelijk', '1.18', 'active', 'Tigrinya'),
(25208, 'Muzit Mehari', 'Berhane', 'Eritrea', 'Vrouwelijk', '1.17', 'active', 'Tigrinya'),
(25209, 'Wafa M I', 'Abunaja', 'Palestina', 'Vrouwelijk', '1.16', 'active', 'Arabisch'),
(25210, 'Marta', 'Da Silva Kumbela', 'Angola', 'Vrouwelijk', '1.19', 'active', 'Portugees'),
(25211, 'Aminata', 'Diallo', 'Guinea', 'Vrouwelijk', '1.19', 'active', 'Peul'),
(25212, 'Gaye', 'Mbagnick', NULL, NULL, '1.14', 'active', NULL)
ON CONFLICT (badge_number) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    nationality = EXCLUDED.nationality,
    gender = EXCLUDED.gender,
    room_number = EXCLUDED.room_number,
    status = EXCLUDED.status,
    language = EXCLUDED.language;

-- Insert Meal Schedules (from keukenlijst.pdf)
-- Note: Setting all meal options to true by default, special cases noted
INSERT INTO meal_schedules (resident_id, badge_number, breakfast, lunch, snack_16h, dinner, snack_21h, special_diet, medication_notes, date)
SELECT 
    r.id,
    r.badge_number,
    true, -- breakfast
    true, -- lunch
    true, -- snack_16h
    true, -- dinner
    true, -- snack_21h
    CASE 
        WHEN r.badge_number = 25172 THEN 'Medicatie'
        ELSE NULL
    END as special_diet,
    CASE 
        WHEN r.badge_number = 25172 THEN 'Medication required'
        ELSE NULL
    END as medication_notes,
    CURRENT_DATE
FROM residents r
ON CONFLICT DO NOTHING;

-- Create Room Assignments
-- This will link residents to their rooms based on the room_number in residents table
INSERT INTO room_assignments (resident_id, room_id, assigned_date, is_current)
SELECT 
    r.id as resident_id,
    rm.id as room_id,
    COALESCE(r.check_in_date::date, CURRENT_DATE) as assigned_date,
    true as is_current
FROM residents r
JOIN rooms rm ON r.room_number = rm.room_number
WHERE r.room_number IS NOT NULL
ON CONFLICT DO NOTHING;

-- Insert some sample appointments based on PDF notes
INSERT INTO appointments (resident_id, appointment_type, appointment_date, appointment_time, location, notes, status)
SELECT 
    r.id,
    'Medical',
    CURRENT_DATE + interval '1 day',
    '09:00:00',
    'Medical Center',
    'Regular checkup',
    'scheduled'
FROM residents r
WHERE r.badge_number IN (25172, 25198, 25203) -- Those with MED notes
ON CONFLICT DO NOTHING;

INSERT INTO appointments (resident_id, appointment_type, appointment_date, appointment_time, location, notes, status)
SELECT 
    r.id,
    'Transfer',
    CURRENT_DATE,
    '10:30:00',
    'Main Office',
    'Transfer to adult center',
    'scheduled'
FROM residents r
WHERE r.badge_number IN (25150, 25172) -- Those with transfer notes
ON CONFLICT DO NOTHING;

INSERT INTO appointments (resident_id, appointment_type, appointment_date, appointment_time, location, notes, status)
SELECT 
    r.id,
    'Legal',
    CURRENT_DATE,
    '11:00:00',
    'Legal Office',
    'Meeting with advocate',
    'scheduled'
FROM residents r
WHERE r.badge_number = 25177 -- Diallo with advocate appointment
ON CONFLICT DO NOTHING;

-- Update room occupancy counts (if triggers didn't handle it)
UPDATE rooms SET current_occupancy = (
    SELECT COUNT(*)
    FROM room_assignments ra
    JOIN residents r ON ra.resident_id = r.id
    WHERE ra.room_id = rooms.id
    AND ra.is_current = true
);

-- Update room availability based on occupancy
UPDATE rooms SET is_available = (current_occupancy < capacity);

-- Create a summary view to verify the data
CREATE OR REPLACE VIEW data_summary AS
SELECT 
    'Total Residents' as metric,
    COUNT(*) as count
FROM residents
WHERE status = 'active'
UNION ALL
SELECT 
    'Total Rooms' as metric,
    COUNT(*) as count
FROM rooms
UNION ALL
SELECT 
    'Available Beds' as metric,
    SUM(capacity - current_occupancy) as count
FROM rooms
UNION ALL
SELECT 
    'Occupied Beds' as metric,
    SUM(current_occupancy) as count
FROM rooms
UNION ALL
SELECT 
    'Scheduled Appointments' as metric,
    COUNT(*) as count
FROM appointments
WHERE status = 'scheduled';

-- Display summary
SELECT * FROM data_summary;