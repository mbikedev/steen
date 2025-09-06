<?php
/**
 * Dashboard Statistics API
 * Provides comprehensive statistics for the dashboard
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
    
    // Get current date for calculations
    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $weekStart = date('Y-m-d', strtotime('monday this week'));
    $weekEnd = date('Y-m-d', strtotime('sunday this week'));
    
    // Get total residents count
    $stmt = $db->query("SELECT COUNT(*) as total FROM residents WHERE status = 'active'");
    $totalResidents = $stmt->fetch()['total'];
    
    // Get today's check-ins
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM residents WHERE DATE(check_in) = ? AND status = 'active'");
    $stmt->execute([$today]);
    $todayCheckIns = $stmt->fetch()['total'];

    // Get yesterday's check-ins for trend calculation
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM residents WHERE DATE(check_in) = ?");
    $stmt->execute([$yesterday]);
    $yesterdayCheckIns = $stmt->fetch()['total'];
    
    // Get today's check-outs
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM residents WHERE DATE(check_out) = ? AND status = 'inactive'");
    $stmt->execute([$today]);
    $todayCheckOuts = $stmt->fetch()['total'];
    
    // Get occupancy statistics
    $totalBeds = 69; // Total capacity
    $stmt = $db->query("SELECT COUNT(*) as occupied FROM residents WHERE status = 'active' AND room IS NOT NULL");
    $occupiedBeds = $stmt->fetch()['occupied'];
    $availableBeds = $totalBeds - $occupiedBeds;
    $occupancyRate = $totalBeds > 0 ? ($occupiedBeds / $totalBeds) * 100 : 0;

    // --- Corrected Trend Calculations ---

    // Calculate daily check-in trend vs yesterday
    $checkInTrend = $yesterdayCheckIns > 0 
        ? (($todayCheckIns - $yesterdayCheckIns) / $yesterdayCheckIns) * 100 
        : ($todayCheckIns > 0 ? 100 : 0);

    // Calculate occupancy trend vs yesterday
    $occupiedBedsYesterday = $occupiedBeds - $todayCheckIns + $todayCheckOuts;
    $occupancyRateYesterday = $totalBeds > 0 ? ($occupiedBedsYesterday / $totalBeds) * 100 : 0;
    $occupancyTrend = $occupancyRateYesterday > 0
        ? (($occupancyRate - $occupancyRateYesterday) / $occupancyRateYesterday) * 100
        : ($occupancyRate > 0 ? 100 : 0);

    // --- Building Specific Stats (No changes needed here) ---

    // Get Noord building stats
    $stmt = $db->query("SELECT COUNT(*) as total FROM residents WHERE status = 'active' AND room LIKE 'Noord%'");
    $noordOccupied = $stmt->fetch()['total'];
    $noordTotal = 36;
    $noordRate = $noordTotal > 0 ? ($noordOccupied / $noordTotal) * 100 : 0;
    
    // Get girls section stats (Noord first floor)
    $stmt = $db->query("SELECT COUNT(*) as total FROM residents WHERE status = 'active' AND room LIKE 'Noord%1%' AND gender = 'F'");
    $girlsOccupied = $stmt->fetch()['total'];
    $girlsTotal = 18;
    $girlsRate = $girlsTotal > 0 ? ($girlsOccupied / $girlsTotal) * 100 : 0;
    
    // Get Zuid building stats
    $stmt = $db->query("SELECT COUNT(*) as total FROM residents WHERE status = 'active' AND room LIKE 'Zuid%'");
    $zuidOccupied = $stmt->fetch()['total'];
    $zuidTotal = 33;
    $zuidRate = $zuidTotal > 0 ? ($zuidOccupied / $zuidTotal) * 100 : 0;
    
    // Get minors section stats (Zuid first floor)
    $stmt = $db->query("SELECT COUNT(*) as total FROM residents WHERE status = 'active' AND room LIKE 'Zuid%1%' AND age < 18");
    $minorsOccupied = $stmt->fetch()['total'];
    $minorsTotal = 15;
    $minorsRate = $minorsTotal > 0 ? ($minorsOccupied / $minorsTotal) * 100 : 0;
    
    // Weekly stats for other parts of the dashboard
    $stmt = $db->prepare("SELECT COUNT(*) as total FROM residents WHERE DATE(check_in) BETWEEN ? AND ?");
    $stmt->execute([$weekStart, $weekEnd]);
    $weeklyCheckIns = $stmt->fetch()['total'];
    
    $prevWeekStart = date('Y-m-d', strtotime('-1 week', strtotime($weekStart)));
    $prevWeekEnd = date('Y-m-d', strtotime('-1 week', strtotime($weekEnd)));
    $stmt->execute([$prevWeekStart, $prevWeekEnd]);
    $prevWeeklyCheckIns = $stmt->fetch()['total'];
    $weeklyCheckInTrend = $prevWeeklyCheckIns > 0 ? (($weeklyCheckIns - $prevWeeklyCheckIns) / $prevWeeklyCheckIns) * 100 : ($weeklyCheckIns > 0 ? 100 : 0);
    
    // Simulated data for other cards
    $pendingDocuments = rand(5, 15);
    $upcomingAppointments = rand(3, 12);
    
    // --- Updated Quick Stats with Corrected Data ---
    $quickStats = [
        [
            'label' => 'Nieuwe Bewoners Vandaag',
            'value' => $todayCheckIns,
            'change' => round($checkInTrend, 1),
            'trend' => $checkInTrend >= 0 ? 'up' : 'down',
            'color' => 'emerald'
        ],
        [
            'label' => 'Documenten in Behandeling',
            'value' => $pendingDocuments,
            'change' => -5.2, // Simulated
            'trend' => 'down',
            'color' => 'blue'
        ],
        [
            'label' => 'Afspraken Deze Week',
            'value' => $upcomingAppointments,
            'change' => 8.1, // Simulated
            'trend' => 'up',
            'color' => 'purple'
        ],
        [
            'label' => 'Bezettingsgraad',
            'value' => round($occupancyRate),
            'change' => round($occupancyTrend, 1),
            'trend' => $occupancyTrend >= 0 ? 'up' : 'down',
            'color' => 'orange'
        ]
    ];
    
    // Prepare JSON response
    $response = [
        'success' => true,
        'timestamp' => date('c'),
        'statistics' => [
            'totalResidents' => $totalResidents,
            'todayCheckIns' => $todayCheckIns,
            'todayCheckOuts' => $todayCheckOuts,
            'weeklyCheckIns' => $weeklyCheckIns,
            'pendingDocuments' => $pendingDocuments,
            'upcomingAppointments' => $upcomingAppointments
        ],
        'occupancy' => [
            'total' => [
                'beds' => $totalBeds,
                'occupied' => $occupiedBeds,
                'available' => $availableBeds,
                'rate' => round($occupancyRate, 1)
            ],
            'noord' => [
                'total' => $noordTotal,
                'occupied' => $noordOccupied,
                'rate' => round($noordRate, 1)
            ],
            'zuid' => [
                'total' => $zuidTotal,
                'occupied' => $zuidOccupied,
                'rate' => round($zuidRate, 1)
            ],
            'girls' => [
                'total' => $girlsTotal,
                'occupied' => $girlsOccupied,
                'rate' => round($girlsRate, 1)
            ],
            'minors' => [
                'total' => $minorsTotal,
                'occupied' => $minorsOccupied,
                'rate' => round($minorsRate, 1)
            ]
        ],
        'quickStats' => $quickStats,
        'trends' => [
            'checkIns' => [
                'current' => $weeklyCheckIns,
                'previous' => $prevWeeklyCheckIns,
                'change' => round($weeklyCheckInTrend, 1),
                'direction' => $weeklyCheckInTrend >= 0 ? 'up' : 'down'
            ]
        ]
    ];
    
    sendJsonResponse($response);
    
} catch (Exception $e) {
    error_log("Dashboard stats error: " . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'error' => 'Failed to fetch dashboard statistics',
        'message' => $e->getMessage()
    ], 500);
}
?>