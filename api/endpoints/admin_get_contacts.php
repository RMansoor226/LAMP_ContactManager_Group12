<?php
// GET /api/admin/contacts                      -> every contact of every user
// GET /api/admin/contacts?userId=5             -> one user's contacts
// GET /api/admin/contacts?search=john          -> search across all users
// GET /api/admin/contacts?userId=5&search=john -> both
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendJson(405, "error", "Method not allowed. Use GET.");
}

$adminId = requireAdmin();

$filterUserId = isset($_GET['userId']) ? intval($_GET['userId']) : 0;
$searchTerm   = isset($_GET['search']) ? trim($_GET['search']) : '';

try {
    $sql = "SELECT c.*, u.Username AS OwnerUsername
            FROM Contacts c
            JOIN Users u ON u.ID = c.UserID
            WHERE 1=1";
    $params = [];

    if ($filterUserId > 0) {
        $sql .= " AND c.UserID = :user_id";
        $params[':user_id'] = $filterUserId;
    }

    if ($searchTerm !== '') {
        $sql .= " AND (LOWER(c.FirstName) LIKE LOWER(:search1)
                    OR LOWER(c.LastName)  LIKE LOWER(:search2)
                    OR LOWER(c.Email)     LIKE LOWER(:search3)
                    OR LOWER(c.PhoneNumber) LIKE LOWER(:search4))";
        $wild = "%" . $searchTerm . "%";
        $params[':search1'] = $wild;
        $params[':search2'] = $wild;
        $params[':search3'] = $wild;
        $params[':search4'] = $wild;
    }

    $sql .= " ORDER BY c.LastName, c.FirstName";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    sendJson(200, "success", "Contacts retrieved successfully.", $stmt->fetchAll());

} catch (PDOException $e) {
    error_log("Database Error in admin_get_contacts.php: " . $e->getMessage());
    sendJson(500, "error", "A database error occurred.");
}
?>
