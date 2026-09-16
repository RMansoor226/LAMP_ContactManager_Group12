<?php
// We can just call our helper function directly!
$test_data = [
    "timestamp" => time(),
    "developer" => "API Team"
];

sendJson(200, "success", "Hello World! The API routing is successfully configured.", $test_data);
?>