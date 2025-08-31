<?php
/**
 * Database Migration Script
 * Executes the migration to remove block column
 */

define('API_ACCESS', true);
require_once 'config.php';

// Set CORS headers
setCorsHeaders();

// Validate API key
validateApiKey();

$db = Database::getInstance()->getConnection();

try {
    // Start transaction
    $db->beginTransaction();
    
    // Check if block column exists
    $checkColumn = $db->query("SHOW COLUMNS FROM residents LIKE 'block'");
    if ($checkColumn->rowCount() == 0) {
        sendJsonResponse([
            'success' => true,
            'message' => 'Block column already removed - no migration needed'
        ]);
    }
    
    // Step 1: Drop the index first (if it exists)
    try {
        $db->exec("ALTER TABLE `residents` DROP INDEX `idx_block`");
        error_log("Migration: Dropped idx_block index");
    } catch (PDOException $e) {
        // Index might not exist, continue
        error_log("Migration: Index idx_block not found or already dropped");
    }
    
    // Step 2: Drop the block column
    $db->exec("ALTER TABLE `residents` DROP COLUMN `block`");
    error_log("Migration: Dropped block column");
    
    // Step 3: Clean up room data
    $updateResult = $db->exec("UPDATE `residents` SET `room` = NULL WHERE `room` = ''");
    error_log("Migration: Cleaned up empty room values - " . $updateResult . " rows affected");
    
    // Commit transaction
    $db->commit();
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Migration completed successfully',
        'changes' => [
            'dropped_index' => 'idx_block',
            'dropped_column' => 'block',
            'cleaned_empty_rooms' => $updateResult
        ]
    ]);
    
} catch (PDOException $e) {
    // Rollback on error
    $db->rollback();
    error_log("Migration error: " . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'error' => 'Migration failed: ' . $e->getMessage()
    ], 500);
}
?>