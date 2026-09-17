<?php
// Ensure POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(405, "error", "Method not allowed. Use POST.");
}

// Ensure the database connection exists
require_once 'config/database.php'; 
$pdo = getDB();

// Read and decode JSON payload
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    sendJson(400, "error", "Invalid JSON payload.");
}

// Validate required fields
if (empty($data['FirstName']) || empty($data['LastName']) || empty($data['Username']) || empty($data['Password'])) {
    sendJson(400, "error", "Missing required fields. FirstName, LastName, Username, and Password are required.");
}

$firstName = trim($data['FirstName']);
$lastName = trim($data['LastName']);
$username = trim($data['Username']); 
$password = $data['Password'];

// Validate email format
if (!filter_var($username, FILTER_VALIDATE_EMAIL)) {
    sendJson(400, "error", "Invalid email format provided for Username.");
}

try {
    // Check for duplicate emails/usernames
    $checkStmt = $pdo->prepare("SELECT ID FROM Users WHERE Username = :username");
    $checkStmt->bindParam(':username', $username);
    $checkStmt->execute();

    if ($checkStmt->rowCount() > 0) {
        // Return 409 Conflict if the user already exists
        sendJson(409, "error", "A user with this email/username already exists.");
    }

    // Hash and salt the password
    // PASSWORD_DEFAULT automatically handles the salting process for you securely
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert the new user into the database
    // Setting default values: Admin = 0 (Standard User), Disabled = 0 (Active), DateCreated/DateUpdated = current date
    $insertStmt = $pdo->prepare("
        INSERT INTO Users (FirstName, LastName, Username, Password, DateCreated, DateUpdated) 
        VALUES (:firstname, :lastname, :username, :password, CURDATE(), CURDATE())
    ");

    $insertStmt->bindParam(':firstname', $firstName);
    $insertStmt->bindParam(':lastname', $lastName);
    $insertStmt->bindParam(':username', $username);
    $insertStmt->bindParam(':password', $hashedPassword);

    if ($insertStmt->execute()) {
        // Return 201 Created on success
        sendJson(201, "success", "User registered successfully.");
    } else {
        sendJson(500, "error", "Failed to register user.");
    }

} catch (PDOException $e) {
    // Log the actual error internally, but return a generic message to the client
    error_log("Database Error in register.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.: " . $e->getMessage());
}
?>