<?php
// PUT/PATCH /api/admin/users/{id}/status
// Body: { Disabled: 1 }  to disable,  { Disabled: 0 }  to re-enable.
// There is intentionally NO delete route for users.
if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    sendJson(405, "error", "Method not allowed. Use PUT.");
}

$adminId = requireAdmin();

$targetId = isset($route[2]) ? intval($route[2]) : 0;
if ($targetId <= 0) {
    sendJson(400, "error", "A valid User ID is required in the URL.");
}

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data) || !isset($data['Disabled'])) {
    sendJson(400, "error", "Disabled (0 or 1) is required.");
}

$disabled = intval($data['Disabled']) === 1 ? 1 : 0;

try {
    $check = $pdo->prepare("SELECT IsAdmin, Disabled FROM Users WHERE ID = :id");
    $check->bindParam(':id', $targetId);
    $check->execute();
    $target = $check->fetch();

    if (!$target) {
        sendJson(404, "error", "User not found.");
    }

    if ($disabled === 1) {
        if ((int)$targetId === (int)$adminId) {
            sendJson(409, "error", "You cannot disable your own account.");
        }
        if ((int)$target['IsAdmin'] === 1 && (int)$target['Disabled'] === 0
            && countActiveAdmins($targetId) === 0) {
            sendJson(409, "error", "Cannot disable the last active administrator.");
        }
    }

    $stmt = $pdo->prepare("UPDATE Users SET Disabled = :disabled WHERE ID = :id");
    $stmt->bindParam(':disabled', $disabled);
    $stmt->bindParam(':id', $targetId);
    $stmt->execute();

    $fetch = $pdo->prepare("SELECT " . ADMIN_USER_COLS . " FROM Users WHERE ID = :id");
    $fetch->bindParam(':id', $targetId);
    $fetch->execute();

    sendJson(200, "success", $disabled ? "User disabled." : "User enabled.", $fetch->fetch());

} catch (PDOException $e) {
    error_log("Database Error in admin_set_status.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>
