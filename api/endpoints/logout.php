<?php
// Ensure POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(405, "error", "Method not allowed. Use POST.");
}

// Ensure the database connection exists
require_once 'config/database.php'; 
$pdo = getDB();

// Start the session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Unset all session variables
$_SESSION = array();

// Destroy the session cookie on the client's browser
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Destroy the session file on the server
session_destroy();

sendJson(200, "success", "Logged out successfully.");
?>