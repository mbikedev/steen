-- Migration: Remove block column from residents table
-- This removes the redundant block field since room numbers already contain building info
-- Date: 2025-08-29

USE u734544155_asylum_center;

-- Remove the block column and its index
ALTER TABLE `residents` 
DROP INDEX `idx_block`,
DROP COLUMN `block`;

-- Update any existing records where room info might be split
-- This is a safety measure in case there's existing data
UPDATE `residents` 
SET `room` = CONCAT(
    CASE 
        WHEN `room` LIKE '1.%' OR `room` LIKE '101' OR `room` LIKE '102' OR `room` LIKE '103' OR `room` LIKE '104' OR `room` LIKE '111' OR `room` LIKE '112' OR `room` LIKE '113' OR `room` LIKE '114' OR `room` LIKE '115' OR `room` LIKE '116' THEN `room`
        WHEN `room` LIKE '2.%' OR `room` LIKE '201' OR `room` LIKE '202' OR `room` LIKE '203' OR `room` LIKE '204' OR `room` LIKE '211' OR `room` LIKE '212' OR `room` LIKE '213' OR `room` LIKE '214' OR `room` LIKE '215' THEN `room`
        ELSE `room`
    END
)
WHERE `room` IS NOT NULL AND `room` != '';

-- Clean up any potential orphaned data
UPDATE `residents` SET `room` = NULL WHERE `room` = '';