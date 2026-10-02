-- Run once. Adjust column names if yours differ.
ALTER TABLE Users
  ADD COLUMN Admin  TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN Disabled TINYINT(1) NOT NULL DEFAULT 0;

-- The root admin is created by scripts/seed_admin.php (so the password is hashed with password_hash()).
-- Or promote an existing user:
-- UPDATE Users SET Admin = 1 WHERE Username = 'your-username';
