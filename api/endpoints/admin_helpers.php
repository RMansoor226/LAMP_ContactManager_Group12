<?php
// Shared admin helpers. Include once from your router before dispatching /admin/* routes.

// Requires a logged-in, enabled admin. Returns the admin's user ID.
function requireAdmin() {
    global $pdo;
    $userId = requireAuth();

    $stmt = $pdo->prepare("SELECT IsAdmin, Disabled FROM Users WHERE ID = :id");
    $stmt->bindParam(':id', $userId);
    $stmt->execute();
    $row = $stmt->fetch();

    if (!$row || (int)$row['Disabled'] === 1) {
        sendJson(403, "error", "This account is disabled.");
    }
    if ((int)$row['IsAdmin'] !== 1) {
        sendJson(403, "error", "Administrator privileges are required.");
    }
    return $userId;
}

// Number of enabled admins, optionally excluding one user ID.
function countActiveAdmins($excludeId = 0) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM Users WHERE IsAdmin = 1 AND Disabled = 0 AND ID <> :ex");
    $stmt->bindParam(':ex', $excludeId);
    $stmt->execute();
    return (int)$stmt->fetchColumn();
}

// Safe user columns (never the password hash).
const ADMIN_USER_COLS = "ID, FirstName, LastName, Username, IsAdmin, Disabled";
