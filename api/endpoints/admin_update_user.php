<?php
// PUT/PATCH /api/admin/users/{id}
// Body: { FirstName, LastName, Username, IsAdmin (0|1, optional) }
// Password and disabled status have their own routes.
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
$data = sanitizeInput($data);

if (empty($data['FirstName']) || empty($data['LastName']) || empty($data['Username'])) {
    sendJson(400, "error", "Missing required fields. FirstName, LastName, and Username are required.");
}

$firstName = $data['FirstName'];
$lastName  = $data['LastName'];
$username  = $data['Username'];

validateLength($firstName, 50, "First Name");
validateLength($lastName, 50, "Last Name");
validateLength($username, 50, "Username");

try {
    $check = $pdo->prepare("SELECT IsAdmin, Disabled FROM Users WHERE ID = :id");
    $check->bindParam(':id', $targetId);
    $check->execute();
    $existing = $check->fetch();

    if (!$existing) {
        sendJson(404, "error", "User not found.");
    }

    $isAdmin = isset($data['IsAdmin']) ? (intval($data['IsAdmin']) === 1 ? 1 : 0) : (int)$existing['IsAdmin'];

    // Don't allow demoting the last enabled admin.
    if ($isAdmin === 0 && (int)$existing['IsAdmin'] === 1 && (int)$existing['Disabled'] === 0
        && countActiveAdmins($targetId) === 0) {
        sendJson(409, "error", "Cannot remove admin rights from the last active administrator.");
    }

    $dup = $pdo->prepare("SELECT ID FROM Users WHERE Username = :username AND ID <> :id");
    $dup->bindParam(':username', $username);
    $dup->bindParam(':id', $targetId);
    $dup->execute();
    if ($dup->fetch()) {
        sendJson(409, "error", "That username is already taken.");
    }

    $stmt = $pdo->prepare("
        UPDATE Users
        SET FirstName = :firstname, LastName = :lastname, Username = :username, IsAdmin = :isadmin
        WHERE ID = :id
    ");
    $stmt->bindParam(':firstname', $firstName);
    $stmt->bindParam(':lastname', $lastName);
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':isadmin', $isAdmin);
    $stmt->bindParam(':id', $targetId);
    $stmt->execute();

    $fetch = $pdo->prepare("SELECT " . ADMIN_USER_COLS . " FROM Users WHERE ID = :id");
    $fetch->bindParam(':id', $targetId);
    $fetch->execute();

    sendJson(200, "success", "User updated successfully.", $fetch->fetch());

} catch (PDOException $e) {
    error_log("Database Error in admin_update_user.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>
