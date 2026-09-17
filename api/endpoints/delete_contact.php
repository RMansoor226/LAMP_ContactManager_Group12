<?php
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    sendJson(405, "error", "Method not allowed. Use DELETE.");
}

// Enforce authentication and grab the logged-in user's ID
$userId = requireAuth();

// Extract the contact ID from the URL (e.g., /api/contacts/123 -> 123)
$contactId = isset($route[1]) ? intval($route[1]) : 0;

if ($contactId <= 0) {
    sendJson(400, "error", "A valid Contact ID is required in the URL (e.g., /api/contacts/{id}).");
}

try {
    // The critical security step: Scope by both Contact ID AND User ID
    $stmt = $pdo->prepare("DELETE FROM Contacts WHERE ID = :contact_id AND UserID = :user_id");
    $stmt->bindParam(':contact_id', $contactId);
    $stmt->bindParam(':user_id', $userId);
    $stmt->execute();

    // Verify that a row was actually deleted
    if ($stmt->rowCount() > 0) {
        // Return 200 OK on successful deletion
        sendJson(200, "success", "Contact deleted successfully.");
    } else {
        // Return 404 if the contact doesn't exist OR the user is trying to delete someone else's contact
        sendJson(404, "error", "Contact not found or you do not have permission to delete it.");
    }

} catch (PDOException $e) {
    error_log("Database Error in delete_contact.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>