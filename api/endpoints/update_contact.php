<?php
// Ensure this is a PUT or PATCH request
if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    sendJson(405, "error", "Method not allowed. Use PUT.");
}

// Enforce authentication and grab the logged-in user's ID
$userId = requireAuth();

// Extract the contact ID from the URL (e.g., /api/contacts/123 -> 123)
$contactId = isset($route[1]) ? intval($route[1]) : 0;

if ($contactId <= 0) {
    sendJson(400, "error", "A valid Contact ID is required in the URL.");
}

// Read and decode JSON payload
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

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
    // Check if the contact exists and verify ownership
    $checkStmt = $pdo->prepare("SELECT UserID FROM Contacts WHERE ID = :contact_id");
    $checkStmt->bindParam(':contact_id', $contactId);
    $checkStmt->execute();
    
    $existingContact = $checkStmt->fetch();

    if (!$existingContact) {
        // Return 404 if the contact doesn't exist at all
        sendJson(404, "error", "Contact not found.");
    }

    if ($existingContact['UserID'] != $userId) {
        // Return 403 if it exists but belongs to a different user
        sendJson(403, "error", "You do not have permission to edit this contact.");
    }

    // Update the contact
    $updateStmt = $pdo->prepare("
        UPDATE Contacts 
        SET FirstName = :firstname, 
            LastName = :lastname, 
            Email = :email, 
            PhoneNumber = :phone, 
            DateUpdated = CURDATE() 
        WHERE ID = :contact_id AND UserID = :user_id
    ");

    $updateStmt->bindParam(':firstname', $firstName);
    $updateStmt->bindParam(':lastname', $lastName);
    $updateStmt->bindParam(':email', $email);
    $updateStmt->bindParam(':phone', $phone);
    $updateStmt->bindParam(':contact_id', $contactId);
    $updateStmt->bindParam(':user_id', $userId);
    
    $updateStmt->execute();

    // Fetch the updated contact record to return it
    $fetchStmt = $pdo->prepare("SELECT * FROM Contacts WHERE ID = :contact_id");
    $fetchStmt->bindParam(':contact_id', $contactId);
    $fetchStmt->execute();
    
    $updatedContact = $fetchStmt->fetch();

    // Return 200 OK and the updated contact object
    sendJson(200, "success", "Contact updated successfully.", $updatedContact);

} catch (PDOException $e) {
    error_log("Database Error in update_contact.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>