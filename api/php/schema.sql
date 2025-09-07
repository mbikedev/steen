-- MySQL Database Schema for Asylum Center Dashboard
-- Compatible with Hostinger MySQL/MariaDB
-- Version: 1.0.0

-- Use existing database (Hostinger format)
USE u734544155_mikaty;

-- ============================================
-- Table: residents
-- ============================================
CREATE TABLE IF NOT EXISTS `residents` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `badge` INT(11) NOT NULL UNIQUE,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `room` VARCHAR(10) DEFAULT NULL,
    `nationality` VARCHAR(50) DEFAULT NULL,
    `ov_number` VARCHAR(50) DEFAULT NULL,
    `register_number` VARCHAR(50) DEFAULT NULL,
    `date_of_birth` DATE DEFAULT NULL,
    `age` INT(3) DEFAULT 0,
    `gender` ENUM('M', 'F', 'X') DEFAULT 'M',
    `reference_person` VARCHAR(100) DEFAULT NULL,
    `date_in` DATE DEFAULT NULL,
    `days_of_stay` INT(11) DEFAULT 1,
    `status` ENUM('active', 'inactive', 'deleted', 'appointment', 'scheduled', 'pending') DEFAULT 'active',
    `remarks` TEXT DEFAULT NULL,
    `room_remarks` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_badge` (`badge`),
    INDEX `idx_status` (`status`),
    INDEX `idx_room` (`room`),
    INDEX `idx_reference_person` (`reference_person`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: rooms
-- ============================================
CREATE TABLE IF NOT EXISTS `rooms` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `room_number` VARCHAR(10) NOT NULL UNIQUE,
    `building` ENUM('Noord', 'Zuid') NOT NULL,
    `floor` INT(1) NOT NULL,
    `capacity` INT(2) NOT NULL DEFAULT 3,
    `current_occupancy` INT(2) DEFAULT 0,
    `room_type` ENUM('standard', 'female', 'minor', 'special') DEFAULT 'standard',
    `status` ENUM('available', 'full', 'maintenance', 'reserved') DEFAULT 'available',
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_room_number` (`room_number`),
    INDEX `idx_building` (`building`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: staff_assignments (Toewijzingen)
-- ============================================
CREATE TABLE IF NOT EXISTS `staff_assignments` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `resident_id` INT(11) NOT NULL,
    `staff_name` VARCHAR(100) NOT NULL,
    `assignment_date` DATE NOT NULL,
    `assignment_type` ENUM('meerderjarig', 'leeftijdstwijfel', 'transfer', 'regular') DEFAULT 'regular',
    `color_code` VARCHAR(20) DEFAULT 'white',
    `position_row` INT(2) DEFAULT NULL,
    `position_col` INT(2) DEFAULT NULL,
    `status` ENUM('active', 'inactive') DEFAULT 'active',
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`resident_id`) REFERENCES `residents`(`id`) ON DELETE CASCADE,
    INDEX `idx_staff_name` (`staff_name`),
    INDEX `idx_assignment_date` (`assignment_date`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: meal_schedules (Keukenlijst)
-- ============================================
CREATE TABLE IF NOT EXISTS `meal_schedules` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `resident_id` INT(11) NOT NULL,
    `schedule_date` DATE NOT NULL,
    `meal_type` ENUM('ontbijt', 'middag', 'snack16', 'avond', 'snack21') NOT NULL,
    `is_present` BOOLEAN DEFAULT TRUE,
    `dietary_requirements` VARCHAR(100) DEFAULT 'Halal',
    `kitchen_schedule` VARCHAR(20) DEFAULT 'Week A',
    `notes` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`resident_id`) REFERENCES `residents`(`id`) ON DELETE CASCADE,
    INDEX `idx_schedule_date` (`schedule_date`),
    INDEX `idx_meal_type` (`meal_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: permissions (Permissielijst)
-- ============================================
CREATE TABLE IF NOT EXISTS `permissions` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `resident_id` INT(11) NOT NULL,
    `permission_type` VARCHAR(50) NOT NULL,
    `start_date` DATETIME NOT NULL,
    `end_date` DATETIME DEFAULT NULL,
    `reason` TEXT DEFAULT NULL,
    `approved_by` VARCHAR(100) DEFAULT NULL,
    `status` ENUM('pending', 'approved', 'denied', 'expired') DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`resident_id`) REFERENCES `residents`(`id`) ON DELETE CASCADE,
    INDEX `idx_permission_type` (`permission_type`),
    INDEX `idx_status` (`status`),
    INDEX `idx_dates` (`start_date`, `end_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: documents
-- ============================================
CREATE TABLE IF NOT EXISTS `documents` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `resident_id` INT(11) DEFAULT NULL,
    `document_type` VARCHAR(50) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_path` VARCHAR(500) NOT NULL,
    `file_size` INT(11) DEFAULT 0,
    `mime_type` VARCHAR(100) DEFAULT NULL,
    `uploaded_by` VARCHAR(100) DEFAULT NULL,
    `upload_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('active', 'archived', 'deleted') DEFAULT 'active',
    PRIMARY KEY (`id`),
    FOREIGN KEY (`resident_id`) REFERENCES `residents`(`id`) ON DELETE SET NULL,
    INDEX `idx_document_type` (`document_type`),
    INDEX `idx_upload_date` (`upload_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: activity_log
-- ============================================
CREATE TABLE IF NOT EXISTS `activity_log` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(100) DEFAULT NULL,
    `action` VARCHAR(50) NOT NULL,
    `entity_type` VARCHAR(50) NOT NULL,
    `entity_id` INT(11) DEFAULT NULL,
    `details` JSON DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_action` (`action`),
    INDEX `idx_entity` (`entity_type`, `entity_id`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: settings
-- ============================================
CREATE TABLE IF NOT EXISTS `settings` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `setting_key` VARCHAR(100) NOT NULL UNIQUE,
    `setting_value` TEXT DEFAULT NULL,
    `setting_type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    `description` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Insert default room data
-- ============================================
-- Noord Building (rooms starting with 1)
INSERT INTO `rooms` (`room_number`, `building`, `floor`, `capacity`, `room_type`) VALUES
-- Ground floor (standard rooms)
('101', 'Noord', 0, 5, 'standard'),
('102', 'Noord', 0, 5, 'standard'),
('103', 'Noord', 0, 4, 'standard'),
('104', 'Noord', 0, 4, 'standard'),
-- First floor (female rooms)
('111', 'Noord', 1, 3, 'female'),
('112', 'Noord', 1, 3, 'female'),
('113', 'Noord', 1, 3, 'female'),
('114', 'Noord', 1, 3, 'female'),
('115', 'Noord', 1, 3, 'female'),
('116', 'Noord', 1, 3, 'female');

-- Zuid Building (rooms starting with 2)
INSERT INTO `rooms` (`room_number`, `building`, `floor`, `capacity`, `room_type`) VALUES
-- Ground floor (standard rooms)
('201', 'Zuid', 0, 5, 'standard'),
('202', 'Zuid', 0, 5, 'standard'),
('203', 'Zuid', 0, 4, 'standard'),
('204', 'Zuid', 0, 4, 'standard'),
-- First floor (minor rooms)
('211', 'Zuid', 1, 3, 'minor'),
('212', 'Zuid', 1, 3, 'minor'),
('213', 'Zuid', 1, 3, 'minor'),
('214', 'Zuid', 1, 3, 'minor'),
('215', 'Zuid', 1, 3, 'minor');

-- ============================================
-- Insert default settings
-- ============================================
INSERT INTO `settings` (`setting_key`, `setting_value`, `setting_type`, `description`) VALUES
('center_name', 'OOC Steenokkerzeel', 'string', 'Name of the asylum center'),
('total_capacity', '69', 'number', 'Total bed capacity'),
('noord_capacity', '36', 'number', 'Noord building capacity'),
('zuid_capacity', '33', 'number', 'Zuid building capacity'),
('female_floor_capacity', '18', 'number', 'Female floor capacity'),
('minor_floor_capacity', '15', 'number', 'Minor floor capacity'),
('default_meal_preference', 'Halal', 'string', 'Default meal preference'),
('default_kitchen_schedule', 'Week A', 'string', 'Default kitchen schedule');

-- ============================================
-- Create views for easier data access
-- ============================================
CREATE OR REPLACE VIEW `room_occupancy_view` AS
SELECT 
    r.room_number,
    r.building,
    r.floor,
    r.capacity,
    r.room_type,
    COUNT(res.id) as current_occupancy,
    (r.capacity - COUNT(res.id)) as available_beds,
    CASE 
        WHEN COUNT(res.id) >= r.capacity THEN 'full'
        WHEN COUNT(res.id) > 0 THEN 'partial'
        ELSE 'empty'
    END as occupancy_status
FROM `rooms` r
LEFT JOIN `residents` res ON r.room_number = res.room AND res.status = 'active'
GROUP BY r.id;

CREATE OR REPLACE VIEW `staff_assignment_summary` AS
SELECT 
    sa.staff_name,
    COUNT(DISTINCT sa.resident_id) as assigned_residents,
    GROUP_CONCAT(CONCAT(r.first_name, ' ', r.last_name) SEPARATOR ', ') as resident_names,
    sa.assignment_date
FROM `staff_assignments` sa
JOIN `residents` r ON sa.resident_id = r.id
WHERE sa.status = 'active' AND r.status = 'active'
GROUP BY sa.staff_name, sa.assignment_date;