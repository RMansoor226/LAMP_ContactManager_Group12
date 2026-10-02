-- Contact Manager schema (PascalCase to match existing PHP)
-- Run against MySQL after creating the database and app user.

CREATE TABLE IF NOT EXISTS Users (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    IsAdmin TINYINT(1) NOT NULL DEFAULT 0,
    Disabled TINYINT(1) NOT NULL DEFAULT 0,
    DateCreated DATE NOT NULL,
    DateUpdated DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS Contacts (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(50) NOT NULL,
    LastName VARCHAR(50) NOT NULL,
    Email VARCHAR(50) NOT NULL,
    PhoneNumber VARCHAR(50) NOT NULL,
    DateCreated DATE NOT NULL,
    DateUpdated DATE NOT NULL,
    UserID INT NOT NULL,
    FOREIGN KEY (UserID) REFERENCES Users(ID) ON DELETE CASCADE,
    INDEX idx_contacts_userid (UserID)
);

-- Migration for existing databases:
-- ALTER TABLE Users
--   ADD COLUMN IsAdmin  TINYINT(1) NOT NULL DEFAULT 0,
--   ADD COLUMN Disabled TINYINT(1) NOT NULL DEFAULT 0;
