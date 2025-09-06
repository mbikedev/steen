<?php
// Activity Log API endpoint
define('API_ACCESS', true);
require_once 'config.php';

setCorsHeaders();
validateApiKey();

try {
    $db = Database::getInstance()->getConnection();
    
    $limit = $_GET['limit'] ?? 50;
    $limit = min($limit, 100); // Cap at 100 for performance
    
    // Get recent activities
    $stmt = $db->prepare("
        SELECT 
            al.*,
            r.first_name,
            r.last_name,
            r.room as room_number
        FROM activity_log al
        LEFT JOIN residents r ON al.resident_id = r.id
        ORDER BY al.created_at DESC
        LIMIT :limit
    ");
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $activities = $stmt->fetchAll();
    
    sendJsonResponse([
        'success' => true,
        'data' => $activities,
        'count' => count($activities),
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    sendJsonResponse([
        'success' => false,
        'error' => 'Failed to fetch activity log',
        'message' => $e->getMessage(),
        'timestamp' => date('Y-m-d H:i:s')
    ], 500);
}
?>
