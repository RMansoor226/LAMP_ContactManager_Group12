-- create and select the database
CREATE DATABASE IF NOT EXISTS `ContactsAppDB`
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE `ContactsAppDB`;

-- create user table
CREATE TABLE IF NOT EXISTS `Users` (
    `ID` INT NOT NULL AUTO_INCREMENT,
    `FirstName` VARCHAR(50) NOT NULL DEFAULT '',
    `LastName` VARCHAR(50) NOT NULL DEFAULT '',
    `Username` VARCHAR(50) NOT NULL DEFAULT '',
    `Password` VARCHAR(50) NOT NULL DEFAULT '',
    `DateCreated` DATE,
    `DateUpdated` DATE,
    PRIMARY KEY (`ID`),
    INDEX `idx_users_login` (`Username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- create contacts table
CREATE TABLE IF NOT EXISTS `Contacts` (
    `ID` INT NOT NULL AUTO_INCREMENT,
    `FirstName` VARCHAR(50) NOT NULL DEFAULT '',
    `LastName` VARCHAR(50) NOT NULL DEFAULT '',
    `Email` VARCHAR(50) NOT NULL DEFAULT '',
    `PhoneNumber` VARCHAR(50) NOT NULL DEFAULT '',
    `DateCreated` DATE,
    `DateUpdated` DATE,
    `UserID` VARCHAR(50) NOT NULL DEFAULT '',
    PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- create Application Database User & Grant Permissions
-- Note: Replace password if desired for custom deployments.
CREATE USER IF NOT EXISTS 'ContactsAppUser'@'localhost' IDENTIFIED BY 'lampcontacts';
GRANT ALL PRIVILEGES ON `ContactsAppDB`.* TO 'ContactsAppUser'@'localhost';

CREATE USER IF NOT EXISTS 'ContactsAppUser'@'%' IDENTIFIED BY 'lampcontacts';
GRANT ALL PRIVILEGES ON `ContactsAppDB`.* TO 'ContactsAppUser'@'%';

FLUSH PRIVILEGES;
