<?php
// GET /api/admin/users            -> list all users
// GET /api/admin/users?search=abc -> search users
// GET /api/admin/users/{id}       -> single user
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(405, "error", "Method not allowed. Use GET.");
}

$adminId = requireAdmin();
$targetId = isset($route[2]) ? intval($route[2]) : 0;

try {
    if ($targetId > 0) {
        $stmt = $pdo->prepare("SELECT " . ADMIN_USER_COLS . " FROM Users WHERE ID = :id");
        $stmt->bindParam(':id', $targetId);
        $stmt->execute();
        $user = $stmt->fetch();

        if ($user) {
            sendJson(200, "success", "User retrieved successfully.", $user);
        } else {
            sendJson(404, "error", "User not found.");
        }
    }

    $searchTerm = isset($_GET['search']) ? trim($_GET['search']) : '';

    if ($searchTerm !== '') {
        $stmt = $pdo->prepare("
            SELECT " . ADMIN_USER_COLS . " FROM Users
            WHERE LOWER(FirstName) LIKE LOWER(:search1)
               OR LOWER(LastName)  LIKE LOWER(:search2)
               OR LOWER(Username)  LIKE LOWER(:search3)
            ORDER BY LastName, FirstName
        ");
        $wild = "%" . $searchTerm . "%";
        $stmt->bindParam(':search1', $wild);
        $stmt->bindParam(':search2', $wild);
        $stmt->bindParam(':search3', $wild);
    } else {
        $stmt = $pdo->prepare("SELECT " . ADMIN_USER_COLS . " FROM Users ORDER BY LastName, FirstName");
    }

    $stmt->execute();
    sendJson(200, "success", "Users retrieved successfully.", $stmt->fetchAll());

} catch (PDOException $e) {
    error_log("Database Error in admin_get_users.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>
