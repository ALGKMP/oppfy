CREATE TABLE `FollowRequest` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`recipientId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `FollowRequest_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `ProfilePicture`;--> statement-breakpoint
ALTER TABLE `Profile` RENAME COLUMN `profilePicture` TO `profilePictureKey`;--> statement-breakpoint
ALTER TABLE `User` DROP INDEX `User_username_unique`;--> statement-breakpoint
ALTER TABLE `Profile` DROP FOREIGN KEY `Profile_profilePicture_ProfilePicture_id_fk`;
--> statement-breakpoint
ALTER TABLE `Blocked` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `Comment` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `FriendRequest` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `Follower` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `Friend` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `Like` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `NotificationSettings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `Post` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `PostStats` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `Profile` MODIFY COLUMN `profilePictureKey` varchar(255) NOT NULL DEFAULT 'profile-pictures/default.jpg';--> statement-breakpoint
ALTER TABLE `Profile` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `VerificationToken` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_username_unique` UNIQUE(`username`);--> statement-breakpoint
ALTER TABLE `Post` ADD `mediaType` enum('image','video') DEFAULT 'image' NOT NULL;--> statement-breakpoint
ALTER TABLE `Profile` ADD `username` varchar(255);--> statement-breakpoint
ALTER TABLE `FollowRequest` ADD CONSTRAINT `FollowRequest_senderId_User_id_fk` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `FollowRequest` ADD CONSTRAINT `FollowRequest_recipientId_User_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `User` DROP COLUMN `username`;