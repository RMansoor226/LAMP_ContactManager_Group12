<?php
// PUT/PATCH /api/admin/users/{id}/password
// Body: { Password }
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
if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    sendJson(400, "error", "Invalid JSON payload.");
}

$password = isset($data['Password']) ? (string)$data['Password'] : '';
if ($password === '') {
    sendJson(400, "error", "Password is required.");
}
if (strlen($password) > 72) {
    sendJson(400, "error", "Password must be 72 characters or fewer.");
}

try {
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("UPDATE Users SET Password = :password WHERE ID = :id");
    $stmt->bindParam(':password', $hash);
    $stmt->bindParam(':id', $targetId);
    $stmt->execute();

    // rowCount() can be 0 if the hash is unchanged, so confirm existence separately.
    $check = $pdo->prepare("SELECT ID FROM Users WHERE ID = :id");
    $check->bindParam(':id', $targetId);
    $check->execute();
    if (!$check->fetch()) {
        sendJson(404, "error", "User not found.");
    }

    sendJson(200, "success", "Password updated successfully.");

} catch (PDOException $e) {
    error_log("Database Error in admin_set_password.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>
