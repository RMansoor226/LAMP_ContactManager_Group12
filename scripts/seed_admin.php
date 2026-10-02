<?php
// Run ONCE from the project root or scripts/: php scripts/seed_admin.php
// Then DELETE this file or change the default password after first login.
require_once __DIR__ . '/../api/config/database.php';

$pdo = getDB();
$defaultPassword = 'ChangeMe!Now1';

$check = $pdo->prepare("SELECT ID FROM Users WHERE Username = :u");
$check->execute([':u' => 'root']);
if ($check->fetch()) {
    exit("root already exists.\n");
}

$stmt = $pdo->prepare("
    INSERT INTO Users (FirstName, LastName, Username, Password, Admin, Disabled, DateCreated, DateUpdated)
    VALUES ('Application', 'Administrator', 'root', :pw, 1, 0, CURDATE(), CURDATE())
");
$stmt->execute([':pw' => password_hash($defaultPassword, PASSWORD_DEFAULT)]);
echo "root admin created. Username: root  Password: {$defaultPassword}\n";
