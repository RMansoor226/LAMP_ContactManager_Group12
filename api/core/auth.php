<?php
function requireAuth() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Check if the session variable was set during login
    if (!isset($_SESSION['user_id'])) {
        sendJson(401, "error", "Unauthorized. Please log in to access this resource.");
    }

    // Return the user ID for use in database queries
    return $_SESSION['user_id'];
}
?>