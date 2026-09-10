USE `ContactsAppDB`;

-- 1. Seed Sample Users
-- User 1: Jane Doe (Plaintext password for demonstration / testing)
INSERT INTO `Users` (`FirstName`, `LastName`, `Username`, `Password`, `DateCreated`, `DateUpdated`) 
VALUES ('Jane', 'Doe', 'JDoe', 'password1', NOW(), '2026-9-9');

-- User 2: Myself
INSERT INTO `Users` (`FirstName`, `LastName`, `Username`, `Password`, `DateCreated`, `DateUpdated`)
VALUES ('Hien', 'Dinh', 'hdtv', 'password2', '2023-4-23', '2026-9-9');


-- 2. Seed Initial Palette Colors for User ID 1 (JDoe)
INSERT INTO `Contacts` (`FirstName`, `LastName`, `Email`, `PhoneNumber`, `DateCreated`, `DateUpdated`, `UserID`) VALUES 
('John', 'Doe', 'johndoe@realmail.com', '123-456-7890', '2026-9-9', '2026-9-9', 1);

-- 3. Seed Initial Palette Colors for User ID 2 (HDTV)
INSERT INTO `Contacts` (`FirstName`, `LastName`, `Email`, `PhoneNumber`, `DateCreated`, `DateUpdated`, `UserID`) VALUES 
('Chad', 'Jepardtee', 'notAIatall@email.com', '987-654-3210', '2024-10-23', '2026-6-10', 2);