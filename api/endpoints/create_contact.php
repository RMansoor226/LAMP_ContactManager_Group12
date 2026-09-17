<?php
// Ensure this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(405, "error", "Method not allowed. Use POST.");
}

// Enforce authentication and grab the logged-in user's ID
$userId = requireAuth();

// Read and decode JSON payload
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    sendJson(400, "error", "Invalid JSON payload.");
}

// Sanitize the entire JSON array against XSS before doing anything else
$data = sanitizeInput($data);

// Validate required fields
if (empty($data['FirstName']) || empty($data['LastName']) || empty($data['Email']) || empty($data['PhoneNumber'])) {
    sendJson(400, "error", "Missing required fields. FirstName, LastName, Email, and PhoneNumber are required.");
}

$firstName = $data['FirstName'];
$lastName = $data['LastName'];
$email = $data['Email'];
$phone = $data['PhoneNumber'];

// Enforce input lengths based on your varchar[50] database limits
validateLength($firstName, 50, "First Name");
validateLength($lastName, 50, "Last Name");
validateLength($email, 50, "Email");
validateLength($phone, 50, "Phone Number");
// --------------------------

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendJson(400, "error", "Invalid email format.");
}

try {
    // Insert the new contact, locked strictly to the logged-in user's ID
    $insertStmt = $pdo->prepare("
        INSERT INTO Contacts (FirstName, LastName, Email, PhoneNumber, DateCreated, DateUpdated, UserID) 
        VALUES (:firstname, :lastname, :email, :phone, CURDATE(), CURDATE(), :user_id)
    ");

    $insertStmt->bindParam(':firstname', $firstName);
    $insertStmt->bindParam(':lastname', $lastName);
    $insertStmt->bindParam(':email', $email);
    $insertStmt->bindParam(':phone', $phone);
    $insertStmt->bindParam(':user_id', $userId);

    $insertStmt->execute();

    // Fetch the newly created contact data to return it (as required by acceptance criteria)
    $newContactId = $pdo->lastInsertId();
    
    $fetchStmt = $pdo->prepare("SELECT * FROM Contacts WHERE ID = :id AND UserID = :user_id");
    $fetchStmt->bindParam(':id', $newContactId);
    $fetchStmt->bindParam(':user_id', $userId);
    $fetchStmt->execute();
    
    $newContact = $fetchStmt->fetch();

    // Return 201 Created and the contact object
    sendJson(201, "success", "Contact created successfully.", $newContact);

} catch (PDOException $e) {
    error_log("Database Error in create_contact.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>