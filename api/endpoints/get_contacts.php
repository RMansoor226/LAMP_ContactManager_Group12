<?php
// Ensure this is a GET request
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(405, "error", "Method not allowed. Use GET.");
}

// Enforce authentication and grab the logged-in user's ID
$userId = requireAuth();

// Extract the contact ID from the URL (e.g., /api/contacts/123 -> 123)
$contactId = isset($route[1]) ? intval($route[1]) : 0;

try {
    if ($contactId > 0) {
        // SINGLE RECORD ENDPOINT: /api/contacts/{id}
        $stmt = $pdo->prepare("SELECT * FROM Contacts WHERE ID = :contact_id AND UserID = :user_id");
        $stmt->bindParam(':contact_id', $contactId);
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        
        $contact = $stmt->fetch();
        
        if ($contact) {
            sendJson(200, "success", "Contact retrieved successfully.", $contact);
        } else {
            // Returns 404 if missing or if the user doesn't own it
            sendJson(404, "error", "Contact not found or you do not have permission to view it.");
        }

    } else {
        // LIST / SEARCH ENDPOINT: /api/contacts
        
        // Check if the frontend passed a search query string (e.g., /api/contacts?search=John)
        $searchTerm = isset($_GET['search']) ? trim($_GET['search']) : '';
        
        if ($searchTerm !== '') {
            // Give each LIKE clause a unique placeholder number
            $stmt = $pdo->prepare("
                SELECT * FROM Contacts 
                WHERE UserID = :user_id 
                AND (
                    LOWER(FirstName) LIKE LOWER(:search1) OR 
                    LOWER(LastName) LIKE LOWER(:search2) OR 
                    LOWER(Email) LIKE LOWER(:search3) OR 
                    LOWER(PhoneNumber) LIKE LOWER(:search4)
                )
            ");
            
            $searchWildcard = "%" . $searchTerm . "%";
            
            // Bind the user ID once
            $stmt->bindParam(':user_id', $userId);
            
            // Bind the search wildcard to all four unique placeholders
            $stmt->bindParam(':search1', $searchWildcard);
            $stmt->bindParam(':search2', $searchWildcard);
            $stmt->bindParam(':search3', $searchWildcard);
            $stmt->bindParam(':search4', $searchWildcard);
        } else {
            // Default list query (returns all of the user's contacts)
            $stmt = $pdo->prepare("SELECT * FROM Contacts WHERE UserID = :user_id");
            $stmt->bindParam(':user_id', $userId);
        }
        
        $stmt->execute();
        $contacts = $stmt->fetchAll(); // Fetch all matching rows as an array
        
        sendJson(200, "success", "Contacts retrieved successfully.", $contacts);
    }

} catch (PDOException $e) {
    error_log("Database Error in get_contacts.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred." . $e->getMessage());
}
?>