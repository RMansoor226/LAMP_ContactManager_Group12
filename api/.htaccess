RewriteEngine On

# If the requested filename is not a directory or a file
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d

# Send everything to index.php, passing the endpoint path as 'request'
RewriteRule ^(.*)$ index.php?request=$1 [QSA,NC,L]