<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
// 1. Include the JSON helper globally
require_once 'core/response.php';

// 2. Global headers for CORS (Cross-Origin Resource Sharing)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Handle preflight OPTIONS requests for CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 3. Parse the requested route (e.g., /api/hello -> 'hello')
$request_path = isset($_GET['request']) ? rtrim($_GET['request'], '/') : '';
$route = explode('/', $request_path);

// 4. Basic Router
$endpoint = $route[0]; // The first part of the URL after /api/

switch ($endpoint) {
    case 'hello':
        require_once 'endpoints/hello.php';
        break;
        
    default:
        // If the URL doesn't match any known endpoints
        sendJson(404, "error", "Endpoint not found.");
        break;
}
?>