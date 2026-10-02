<?php
function requireAuth() {
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['user_id'])) {
        sendJson(401, "error", "Unauthorized. Please log in to access this resource.");
    }

    global $pdo;
    $userId = $_SESSION['user_id'];

    try {
        $stmt = $pdo->prepare("SELECT Disabled FROM Users WHERE ID = :id");
        $stmt->bindParam(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch();

        if (!$row || (int)$row['Disabled'] === 1) {
            session_unset();
            session_destroy();
            sendJson(403, "error", "This account has been disabled.");
        }
    } catch (PDOException $e) {
        error_log("Database Error in requireAuth: " . $e->getMessage());
        sendJson(500, "error", "A database error occurred.");
    }

    return $userId;
}
?>
