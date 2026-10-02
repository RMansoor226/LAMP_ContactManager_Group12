<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
// Include the JSON helper globally
require_once 'core/response.php';
require_once 'core/auth.php';
require_once 'core/security.php';
require_once 'config/database.php';
$pdo = getDB();

setCORSHeaders();

// Handle preflight OPTIONS requests for CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Parse the requested route (e.g., /api/hello -> 'hello')
$request_path = isset($_GET['request']) ? rtrim($_GET['request'], '/') : '';
$route = explode('/', $request_path);

// Basic Router
$endpoint = $route[0]; // The first part of the URL after /api/

switch ($endpoint) {
    case 'hello':
        require_once 'endpoints/hello.php';
        break;

    case 'register':
        require_once 'endpoints/register.php';
        break;

    case 'login':
        require_once 'endpoints/login.php';
        break;

    case 'logout':
        require_once 'endpoints/logout.php';
        break;

    case 'contacts':
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            require_once 'endpoints/create_contact.php';
        } elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
            require_once 'endpoints/delete_contact.php';
        } elseif ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
            require_once 'endpoints/update_contact.php';
        } elseif ($_SERVER['REQUEST_METHOD'] === 'GET') {
            require_once 'endpoints/get_contacts.php';
        }
        break;

    case 'admin':
        require_once 'endpoints/admin_helpers.php';

        $resource = $route[1] ?? '';
        $action   = $route[3] ?? '';
        $method   = $_SERVER['REQUEST_METHOD'];

        if ($resource === 'users') {
            if ($action === 'password') {
                require 'endpoints/admin_set_password.php';
            } elseif ($action === 'status') {
                require 'endpoints/admin_set_status.php';
            } elseif ($method === 'GET') {
                require 'endpoints/admin_get_users.php';
            } elseif ($method === 'POST') {
                require 'endpoints/admin_create_user.php';
            } elseif ($method === 'PUT' || $method === 'PATCH') {
                require 'endpoints/admin_update_user.php';
            } else {
                sendJson(405, "error", "Method not allowed. Users cannot be deleted; use /status to disable.");
            }
        } elseif ($resource === 'contacts') {
            require 'endpoints/admin_get_contacts.php';
        } else {
            sendJson(404, "error", "Unknown admin route.");
        }
        break;
        
    default:
        // If the URL doesn't match any known endpoints
        sendJson(404, "error", "Endpoint not found.");
        break;
}
?>
