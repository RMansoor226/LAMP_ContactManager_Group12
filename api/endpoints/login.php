<?php
// Ensure POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(405, "error", "Method not allowed. Use POST.");
}

// Start the session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Read and decode JSON payload
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    sendJson(400, "error", "Invalid JSON payload.");
}

// Validate required fields
if (empty($data['Username']) || empty($data['Password'])) {
    sendJson(400, "error", "Missing required fields. Username and Password are required.");
}

$username = trim($data['Username']); 
$password = $data['Password'];

error_log("LOGIN DEBUG username=[" . $username . "]");
error_log("LOGIN DEBUG password=[" . $password . "]");

// // Validate email format
// if (!filter_var($username, FILTER_VALIDATE_EMAIL)) {
//     sendJson(400, "error", "Invalid email format provided for Username.");
// }

try {
    // Fetch the user by their Username (Email)
    $stmt = $pdo->prepare("SELECT ID, FirstName, LastName, Username, Password FROM Users WHERE Username = :username");
    $stmt->bindParam(':username', $username);
    $stmt->execute();
    $user = $stmt->fetch();

    error_log("LOGIN DEBUG user found=" . ($user ? "YES" : "NO"));

    if ($user) {
        error_log("LOGIN DEBUG DB username=[" . $user['Username'] . "]");
        error_log("LOGIN DEBUG hash=[" . $user['Password'] . "]");
        error_log("LOGIN DEBUG password_verify=" .
            (password_verify($password, $user['Password']) ? "TRUE" : "FALSE")
        );
    }

    $authErrorMessage = "Invalid username or password.";

    // Verify user exists AND the password matches
    if ($user && password_verify($password, $user['Password'])) {
        // Start the secure session
        // Regenerate the session ID
        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['ID'];

        // Remove the password hash from the array before sending the user data back to the frontend
        unset($user['Password']);

        sendJson(200, "success", "Login successful.", $user);
    } else {
        // Return 401 Unauthorized if verification fails
        sendJson(401, "error", $authErrorMessage);
    }

} catch (PDOException $e) {
    // Log the actual error internally, but return a generic message to the client
    error_log("Database Error in login.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>