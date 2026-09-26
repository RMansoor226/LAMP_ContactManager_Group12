<?php
// Ensure POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(405, "error", "Method not allowed. Use POST.");
}

// Read and decode JSON payload
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
    sendJson(400, "error", "Invalid JSON payload.");
}

// Validate required fields before sanitizing so a missing password is not confused with a hash
if (
    !isset($data['FirstName'], $data['LastName'], $data['Username'], $data['Password']) ||
    !is_string($data['FirstName']) ||
    !is_string($data['LastName']) ||
    !is_string($data['Username']) ||
    !is_string($data['Password']) ||
    trim($data['FirstName']) === '' ||
    trim($data['LastName']) === '' ||
    trim($data['Username']) === '' ||
    $data['Password'] === ''
) {
    sendJson(
        400,
        "error",
        "Missing required fields. FirstName, LastName, Username, and Password are required."
    );
}

// Sanitize text fields only. The password is hashed, not stored or rendered, and must match login byte-for-byte.
$firstName = sanitizeInput($data['FirstName']);
$lastName = sanitizeInput($data['LastName']);
$username = sanitizeInput($data['Username']);
$password = $data['Password'];

validateLength($firstName, 50, "First Name");
validateLength($lastName, 50, "Last Name");
validateLength($username, 50, "Username");
validateLength($password, 72, "Password");

if (!filter_var($username, FILTER_VALIDATE_EMAIL)) {
    sendJson(400, "error", "Invalid email format provided for Username.");
}

try {
    $checkStmt = $pdo->prepare("SELECT ID FROM Users WHERE Username = :username");
    $checkStmt->bindParam(':username', $username);
    $checkStmt->execute();

    if ($checkStmt->rowCount() > 0) {
        sendJson(409, "error", "A user with this email/username already exists.");
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    $insertStmt = $pdo->prepare("
        INSERT INTO Users (FirstName, LastName, Username, Password, DateCreated, DateUpdated)
        VALUES (:firstname, :lastname, :username, :password, CURDATE(), CURDATE())
    ");

    $insertStmt->bindParam(':firstname', $firstName);
    $insertStmt->bindParam(':lastname', $lastName);
    $insertStmt->bindParam(':username', $username);
    $insertStmt->bindParam(':password', $hashedPassword);

    if ($insertStmt->execute()) {
        sendJson(201, "success", "User registered successfully.");
    }

    sendJson(500, "error", "Failed to register user.");
} catch (PDOException $e) {
    error_log("Database Error in register.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>
