-- Generate random data for the new user
SET @newUserId = UUID();
SET @newProfileId = FLOOR(RAND() * 100000);
SET @newProfilePictureId = FLOOR(RAND() * 100000);
SET @newNotificationSettingsId = FLOOR(RAND() * 100000);
SET @username = CONCAT('user', FLOOR(RAND() * 10000));
SET @fullName = CONCAT('User', FLOOR(RAND() * 10000), ' ', 'Last');
SET @bio = 'This is a random bio.';
SET @profilePictureKey = CONCAT('profile-pictures/', @username, '.jpg');

-- Set the example user ID
SET @exampleUserId = 'ORzS7idbUdPf44KV9XDHK95uenv2';

-- Insert into ProfilePicture
INSERT INTO `ProfilePicture` (`id`, `url`, `createdAt`, `updatedAt`)
VALUES (@newProfilePictureId, @profilePictureKey, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert into NotificationSettings
INSERT INTO `NotificationSettings` (`id`, `posts`, `likes`, `mentions`, `comments`, `followRequests`, `friendRequests`, `createdAt`, `updatedAt`)
VALUES (@newNotificationSettingsId, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert into Profile
INSERT INTO `Profile` (`id`, `fullName`, `dateOfBirth`, `bio`, `profilePicture`, `createdAt`, `updatedAt`)
VALUES (@newProfileId, @fullName, '1990-01-01', @bio, @newProfilePictureId, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert into User
INSERT INTO `User` (`id`, `profile`, `username`, `notificationSettingsId`, `privacySetting`, `createdAt`, `updatedAt`)
VALUES (@newUserId, @newProfileId, @username, @newNotificationSettingsId, 'public', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Make the new user a follower of example_user_id
INSERT INTO `Follower` (`senderId`, `recipientId`, `createdAt`)
VALUES (@newUserId, @exampleUserId, CURRENT_TIMESTAMP);

-- Make example_user_id follow the new user
INSERT INTO `Follower` (`senderId`, `recipientId`, `createdAt`)
VALUES (@exampleUserId, @newUserId, CURRENT_TIMESTAMP);

-- Make the new user and example_user_id friends
INSERT INTO `Friend` (`userId1`, `userId2`, `createdAt`)
VALUES (@newUserId, @exampleUserId, CURRENT_TIMESTAMP);

-- Select to verify the inserted data
SELECT * FROM `User` WHERE `id` = @newUserId;
SELECT * FROM `Profile` WHERE `id` = @newProfileId;
SELECT * FROM `ProfilePicture` WHERE `id` = @newProfilePictureId;
SELECT * FROM `NotificationSettings` WHERE `id` = @newNotificationSettingsId;
SELECT * FROM `Follower` WHERE `senderId` = @newUserId OR `recipientId` = @newUserId;
SELECT * FROM `Friend` WHERE `userId1` = @newUserId OR `userId2` = @newUserId;
