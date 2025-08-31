<?php
/**
 * Test Migration - Check if block column exists
 */

define('API_ACCESS', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();

try {
    // Check current table structure
    $result = $db->query("DESCRIBE residents");
    $columns = $result->fetchAll(PDO::FETCH_COLUMN);
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Table structure retrieved',
        'columns' => $columns,
        'has_block_column' => in_array('block', $columns)
    ]);
    
} catch (PDOException $e) {
    sendJsonResponse([
        'success' => false,
        'error' => 'Failed to check table structure: ' . $e->getMessage()
    ], 500);
}
?>