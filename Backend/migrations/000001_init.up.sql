CREATE TABLE `User` (
    `UserID` INT AUTO_INCREMENT PRIMARY KEY,
    `FirstName` VARCHAR(64) NOT NULL,
    `LastName` VARCHAR(64) NOT NULL,
    `Email` VARCHAR(255) UNIQUE NOT NULL,
    `ImageUrl` VARCHAR(64)
);

CREATE TABLE `Event` (
    `EventID` INT AUTO_INCREMENT PRIMARY KEY,
    `Title` VARCHAR(64) NOT NULL,
    `Description` TEXT,
    `EventDate` DATETIME NOT NULL,
    `EventAddress` VARCHAR(64) NOT NULL,
    `CreatorUserID` INT NOT NULL,
    `VKLink` VARCHAR(255),
    `TGLink` VARCHAR(255),
    `ImageURL` VARCHAR(255),
    FOREIGN KEY (`CreatorUserID`) REFERENCES `User`(`UserID`) ON DELETE CASCADE,
    UNIQUE KEY `uniq_event` (`Title`, `EventDate`, `CreatorUserID`)
);

CREATE TABLE `Registration` (
    `UserID` INT NOT NULL,
    `EventID` INT NOT NULL,
    PRIMARY KEY (`UserID`, `EventID`),
    FOREIGN KEY (`UserID`) REFERENCES `User`(`UserID`) ON DELETE CASCADE,
    FOREIGN KEY (`EventID`) REFERENCES `Event`(`EventID`) ON DELETE CASCADE
);
