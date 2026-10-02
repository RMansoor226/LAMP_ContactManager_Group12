<?php
// POST /api/admin/users
// Body: { FirstName, LastName, Username, Password, IsAdmin (0|1, optional) }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(405, "error", "Method not allowed. Use POST.");
}

$adminId = requireAdmin();

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    sendJson(400, "error", "Invalid JSON payload.");
}

// Don't run the password through sanitizeInput (it would alter special characters).
$password = isset($data['Password']) ? (string)$data['Password'] : '';
unset($data['Password']);
$data = sanitizeInput($data);

if (empty($data['FirstName']) || empty($data['LastName']) || empty($data['Username']) || $password === '') {
    sendJson(400, "error", "Missing required fields. FirstName, LastName, Username, and Password are required.");
}

$firstName = $data['FirstName'];
$lastName  = $data['LastName'];
$username  = $data['Username'];
$isAdmin   = (isset($data['IsAdmin']) && intval($data['IsAdmin']) === 1) ? 1 : 0;

validateLength($firstName, 50, "First Name");
validateLength($lastName, 50, "Last Name");
validateLength($username, 50, "Username");
if (strlen($password) > 72) {
    sendJson(400, "error", "Password must be 72 characters or fewer.");
}

try {
    $dup = $pdo->prepare("SELECT ID FROM Users WHERE Username = :username");
    $dup->bindParam(':username', $username);
    $dup->execute();
    if ($dup->fetch()) {
        sendJson(409, "error", "That username is already taken.");
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("
        INSERT INTO Users (FirstName, LastName, Username, Password, IsAdmin, Disabled, DateCreated, DateUpdated)
        VALUES (:firstname, :lastname, :username, :password, :isadmin, 0, CURDATE(), CURDATE())
    ");
    $stmt->bindParam(':firstname', $firstName);
    $stmt->bindParam(':lastname', $lastName);
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':password', $hash);
    $stmt->bindParam(':isadmin', $isAdmin);
    $stmt->execute();

    $newId = $pdo->lastInsertId();
    $fetch = $pdo->prepare("SELECT " . ADMIN_USER_COLS . " FROM Users WHERE ID = :id");
    $fetch->bindParam(':id', $newId);
    $fetch->execute();

    sendJson(201, "success", "User created successfully.", $fetch->fetch());

} catch (PDOException $e) {
    error_log("Database Error in admin_create_user.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>
