<?php
/**
 * Recent Activities API
 * Provides recent activities for the dashboard
 */

// Define API access constant
define('API_ACCESS', true);

// Load configuration
require_once __DIR__ . '/config.php';

// Set CORS headers
setCorsHeaders();

// Validate API key
validateApiKey();

try {
    $db = Database::getInstance()->getConnection();
    
    // Get limit parameter (default 10, max 50)
    $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 10;
    
    $activities = [];
    
    // Get recent check-ins
    $stmt = $db->prepare("
        SELECT 
            CONCAT('checkin_', id) as activity_id,
            'checkin' as type,
            CONCAT(first_name, ' ', last_name) as resident_name,
            room,
            check_in as activity_time,
            'Nieuwe Bewoner' as title
        FROM residents 
        WHERE check_in IS NOT NULL 
            AND check_in >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY check_in DESC 
        LIMIT 5
    ");
    $stmt->execute();
    $checkIns = $stmt->fetchAll();
    
    foreach ($checkIns as $checkIn) {
        $activities[] = [
            'id' => $checkIn['activity_id'],
            'type' => 'checkin',
            'title' => $checkIn['title'],
            'description' => $checkIn['resident_name'] . ' ingecheckt in ' . ($checkIn['room'] ?: 'nog niet toegewezen'),
            'time' => formatTimeAgo($checkIn['activity_time']),
            'timestamp' => $checkIn['activity_time'],
            'icon' => 'UserPlus',
            'color' => 'green'
        ];
    }
    
    // Get recent check-outs
    $stmt = $db->prepare("
        SELECT 
            CONCAT('checkout_', id) as activity_id,
            'checkout' as type,
            CONCAT(first_name, ' ', last_name) as resident_name,
            room,
            check_out as activity_time,
            'Bewoner Vertrokken' as title
        FROM residents 
        WHERE check_out IS NOT NULL 
            AND check_out >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY check_out DESC 
        LIMIT 5
    ");
    $stmt->execute();
    $checkOuts = $stmt->fetchAll();
    
    foreach ($checkOuts as $checkOut) {
        $activities[] = [
            'id' => $checkOut['activity_id'],
            'type' => 'checkout',
            'title' => $checkOut['title'],
            'description' => $checkOut['resident_name'] . ' uitgecheckt uit ' . ($checkOut['room'] ?: 'onbekende kamer'),
            'time' => formatTimeAgo($checkOut['activity_time']),
            'timestamp' => $checkOut['activity_time'],
            'icon' => 'Users',
            'color' => 'orange'
        ];
    }
    
    // Get recent photo uploads
    $stmt = $db->prepare("
        SELECT 
            CONCAT('photo_', rp.id) as activity_id,
            'document' as type,
            CONCAT(r.first_name, ' ', r.last_name) as resident_name,
            rp.uploaded_at as activity_time,
            'Foto Geüpload' as title
        FROM resident_photos rp
        JOIN residents r ON rp.resident_id = r.id
        WHERE rp.uploaded_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY rp.uploaded_at DESC 
        LIMIT 5
    ");
    $stmt->execute();
    $photos = $stmt->fetchAll();
    
    foreach ($photos as $photo) {
        $activities[] = [
            'id' => $photo['activity_id'],
            'type' => 'document',
            'title' => $photo['title'],
            'description' => 'Nieuwe foto voor ' . $photo['resident_name'],
            'time' => formatTimeAgo($photo['activity_time']),
            'timestamp' => $photo['activity_time'],
            'icon' => 'FileUp',
            'color' => 'blue'
        ];
    }
    
    // Add some simulated appointment activities
    $appointmentTimes = [
        '-30 minutes',
        '-2 hours',
        '-5 hours',
        '-1 day',
        '-2 days'
    ];
    
    $appointmentTypes = [
        ['title' => 'Medische Controle', 'description' => 'Gezondheidscheck voor 3 bewoners'],
        ['title' => 'Juridisch Advies', 'description' => 'Asielprocedure bespreking'],
        ['title' => 'Taalles', 'description' => 'Nederlandse les groep A'],
        ['title' => 'Sociale Dienst', 'description' => 'Intake gesprek nieuwe bewoners'],
        ['title' => 'Psychologische Hulp', 'description' => 'Individuele sessie gepland']
    ];
    
    for ($i = 0; $i < min(5, count($appointmentTimes)); $i++) {
        $appointmentTime = date('Y-m-d H:i:s', strtotime($appointmentTimes[$i]));
        $appointmentType = $appointmentTypes[$i % count($appointmentTypes)];
        
        $activities[] = [
            'id' => 'appointment_' . ($i + 1),
            'type' => 'appointment',
            'title' => $appointmentType['title'],
            'description' => $appointmentType['description'],
            'time' => formatTimeAgo($appointmentTime),
            'timestamp' => $appointmentTime,
            'icon' => 'Calendar',
            'color' => 'purple'
        ];
    }
    
    // Sort all activities by timestamp (most recent first)
    usort($activities, function($a, $b) {
        return strtotime($b['timestamp']) - strtotime($a['timestamp']);
    });
    
    // Limit the results
    $activities = array_slice($activities, 0, $limit);
    
    // Remove timestamp from final output (was only needed for sorting)
    foreach ($activities as &$activity) {
        unset($activity['timestamp']);
    }
    
    // Prepare response
    $response = [
        'success' => true,
        'timestamp' => date('c'),
        'count' => count($activities),
        'activities' => $activities
    ];
    
    sendJsonResponse($response);
    
} catch (Exception $e) {
    error_log("Recent activities error: " . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'error' => 'Failed to fetch recent activities',
        'message' => $e->getMessage()
    ], 500);
}

/**
 * Format time ago string in Dutch
 */
function formatTimeAgo($datetime) {
    $time = strtotime($datetime);
    $now = time();
    $diff = $now - $time;
    
    if ($diff < 60) {
        return 'Zojuist';
    } elseif ($diff < 3600) {
        $minutes = floor($diff / 60);
        return $minutes . ' ' . ($minutes == 1 ? 'minuut' : 'minuten') . ' geleden';
    } elseif ($diff < 86400) {
        $hours = floor($diff / 3600);
        return $hours . ' ' . ($hours == 1 ? 'uur' : 'uur') . ' geleden';
    } elseif ($diff < 604800) {
        $days = floor($diff / 86400);
        return $days . ' ' . ($days == 1 ? 'dag' : 'dagen') . ' geleden';
    } else {
        return date('d-m-Y H:i', $time);
    }
}
?>