<?php
function sendJson($statusCode, $status, $message, $data = null) {
    // Set the HTTP status code (e.g., 200, 400, 401, 500)
    http_response_code($statusCode);
    
    // Force the output to be JSON
    header("Content-Type: application/json; charset=UTF-8");
    
    $response = [
        "status" => $status,
        "message" => $message
    ];
    
    // Only include the data array if it was provided
    if ($data !== null) {
        $response["data"] = $data;
    }
    
    // Output the JSON and immediately stop script execution
    echo json_encode($response);
    exit(); 
}
?>