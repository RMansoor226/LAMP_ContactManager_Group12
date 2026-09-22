<?php
// XSS Mitigation: Sanitize inputs to prevent malicious scripts from being stored or executed
function sanitizeInput($data) {
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            $data[$key] = sanitizeInput($value);
        }
    } else {
        // htmlspecialchars converts special characters to HTML entities (e.g., < becomes &lt;)
        $data = htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
    }
    return $data;
}

// Input Length Validation to prevent database truncation errors
function validateLength($string, $maxLength, $fieldName) {
    if (strlen($string) > $maxLength) {
        sendJson(400, "error", "$fieldName cannot exceed $maxLength characters.");
    }
}
?>