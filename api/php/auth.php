<?php
/**
 * Authentication API
 * Handles user login, session management, and token validation
 */

// Define API access constant
define('API_ACCESS', true);

// Load configuration
require_once __DIR__ . '/config.php';

// Set CORS headers
setCorsHeaders();

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'POST':
            handleLogin();
            break;
            
        case 'GET':
            handleTokenValidation();
            break;
            
        case 'DELETE':
            handleLogout();
            break;
            
        default:
            sendJsonResponse([
                'success' => false,
                'error' => 'Method not allowed'
            ], 405);
    }
    
} catch (Exception $e) {
    error_log("Auth error: " . $e->getMessage());
    sendJsonResponse([
        'success' => false,
        'error' => 'Authentication service error',
        'message' => $e->getMessage()
    ], 500);
}

/**
 * Handle user login
 */
function handleLogin() {
    // Get POST data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Invalid JSON data'
        ], 400);
        return;
    }
    
    $email = trim($input['email'] ?? '');
    $password = trim($input['password'] ?? '');
    $remember = $input['remember'] ?? false;
    
    // Validate input
    if (empty($email) || empty($password)) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Email en wachtwoord zijn verplicht'
        ], 400);
        return;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Ongeldig email adres'
        ], 400);
        return;
    }
    
    // Demo credentials
    $validCredentials = [
        'admin@ooc.be' => 'admin123',
        'manager@ooc.be' => 'manager123',
        'staff@ooc.be' => 'staff123'
    ];
    
    // Check credentials
    if (!isset($validCredentials[$email]) || $validCredentials[$email] !== $password) {
        // Add delay to prevent brute force attacks
        sleep(1);
        
        sendJsonResponse([
            'success' => false,
            'error' => 'Ongeldige inloggegevens'
        ], 401);
        return;
    }
    
    // Get user role based on email
    $role = getUserRole($email);
    
    // Generate JWT-like token
    $tokenData = [
        'email' => $email,
        'role' => $role,
        'timestamp' => time(),
        'expires' => $remember ? (time() + (30 * 24 * 60 * 60)) : (time() + (24 * 60 * 60)), // 30 days if remember, 1 day otherwise
        'remember' => $remember
    ];
    
    $token = base64_encode(json_encode($tokenData));
    
    // Store session in database/cache (simplified for demo)
    $sessionId = generateSessionId();
    storeSession($sessionId, $tokenData);
    
    // Prepare user data
    $userData = [
        'email' => $email,
        'role' => $role,
        'name' => getUserName($email),
        'permissions' => getUserPermissions($role)
    ];
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Succesvol ingelogd',
        'token' => $token,
        'sessionId' => $sessionId,
        'user' => $userData,
        'expiresAt' => date('c', $tokenData['expires'])
    ]);
}

/**
 * Handle token validation
 */
function handleTokenValidation() {
    $token = $_GET['token'] ?? '';
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (empty($token) && !empty($authHeader)) {
        $token = str_replace('Bearer ', '', $authHeader);
    }
    
    if (empty($token)) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Token is required'
        ], 400);
        return;
    }
    
    $tokenData = validateToken($token);
    
    if (!$tokenData) {
        sendJsonResponse([
            'success' => false,
            'error' => 'Ongeldig of verlopen token'
        ], 401);
        return;
    }
    
    // Prepare user data
    $userData = [
        'email' => $tokenData['email'],
        'role' => $tokenData['role'],
        'name' => getUserName($tokenData['email']),
        'permissions' => getUserPermissions($tokenData['role'])
    ];
    
    sendJsonResponse([
        'success' => true,
        'valid' => true,
        'user' => $userData,
        'expiresAt' => date('c', $tokenData['expires'])
    ]);
}

/**
 * Handle logout
 */
function handleLogout() {
    $input = json_decode(file_get_contents('php://input'), true);
    $token = $input['token'] ?? '';
    $sessionId = $input['sessionId'] ?? '';
    
    if (!empty($sessionId)) {
        removeSession($sessionId);
    }
    
    sendJsonResponse([
        'success' => true,
        'message' => 'Succesvol uitgelogd'
    ]);
}

/**
 * Validate authentication token
 */
function validateToken($token) {
    try {
        $tokenData = json_decode(base64_decode($token), true);
        
        if (!$tokenData || !isset($tokenData['email'], $tokenData['expires'])) {
            return false;
        }
        
        // Check if token is expired
        if (time() > $tokenData['expires']) {
            return false;
        }
        
        return $tokenData;
    } catch (Exception $e) {
        return false;
    }
}

/**
 * Get user role based on email
 */
function getUserRole($email) {
    $roles = [
        'admin@ooc.be' => 'admin',
        'manager@ooc.be' => 'manager',
        'staff@ooc.be' => 'staff'
    ];
    
    return $roles[$email] ?? 'staff';
}

/**
 * Get user display name
 */
function getUserName($email) {
    $names = [
        'admin@ooc.be' => 'Administrator',
        'manager@ooc.be' => 'Manager',
        'staff@ooc.be' => 'Staff Member'
    ];
    
    return $names[$email] ?? 'User';
}

/**
 * Get user permissions based on role
 */
function getUserPermissions($role) {
    $permissions = [
        'admin' => [
            'dashboard.view',
            'residents.create',
            'residents.edit',
            'residents.delete',
            'residents.view',
            'beds.manage',
            'documents.upload',
            'documents.view',
            'appointments.create',
            'appointments.edit',
            'appointments.delete',
            'reports.generate',
            'users.manage'
        ],
        'manager' => [
            'dashboard.view',
            'residents.create',
            'residents.edit',
            'residents.view',
            'beds.manage',
            'documents.upload',
            'documents.view',
            'appointments.create',
            'appointments.edit',
            'reports.generate'
        ],
        'staff' => [
            'dashboard.view',
            'residents.view',
            'documents.view',
            'appointments.view'
        ]
    ];
    
    return $permissions[$role] ?? $permissions['staff'];
}

/**
 * Generate secure session ID
 */
function generateSessionId() {
    return bin2hex(random_bytes(32));
}

/**
 * Store session data (simplified - in production use Redis/database)
 */
function storeSession($sessionId, $data) {
    // In production, store in database or Redis
    // For demo, we'll use file storage (not recommended for production)
    $sessionsDir = __DIR__ . '/sessions';
    if (!is_dir($sessionsDir)) {
        mkdir($sessionsDir, 0755, true);
    }
    
    $sessionFile = $sessionsDir . '/' . $sessionId . '.json';
    file_put_contents($sessionFile, json_encode($data));
}

/**
 * Remove session
 */
function removeSession($sessionId) {
    $sessionFile = __DIR__ . '/sessions/' . $sessionId . '.json';
    if (file_exists($sessionFile)) {
        unlink($sessionFile);
    }
}

/**
 * Get session data
 */
function getSession($sessionId) {
    $sessionFile = __DIR__ . '/sessions/' . $sessionId . '.json';
    if (!file_exists($sessionFile)) {
        return null;
    }
    
    $data = json_decode(file_get_contents($sessionFile), true);
    
    // Check if session is expired
    if (isset($data['expires']) && time() > $data['expires']) {
        unlink($sessionFile);
        return null;
    }
    
    return $data;
}
?>