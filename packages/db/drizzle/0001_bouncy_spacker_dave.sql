ALTER TABLE `FriendRequest` RENAME COLUMN `requesterId` TO `senderId`;--> statement-breakpoint
ALTER TABLE `FriendRequest` RENAME COLUMN `requestedId` TO `recipientId`;--> statement-breakpoint
ALTER TABLE `Follower` RENAME COLUMN `followerId` TO `senderId`;--> statement-breakpoint
ALTER TABLE `Follower` RENAME COLUMN `followedId` TO `recipientId`;--> statement-breakpoint
ALTER TABLE `FriendRequest` DROP FOREIGN KEY `FriendRequest_requesterId_User_id_fk`;
--> statement-breakpoint
ALTER TABLE `FriendRequest` DROP FOREIGN KEY `FriendRequest_requestedId_User_id_fk`;
--> statement-breakpoint
ALTER TABLE `Follower` DROP FOREIGN KEY `Follower_followerId_User_id_fk`;
--> statement-breakpoint
ALTER TABLE `Follower` DROP FOREIGN KEY `Follower_followedId_User_id_fk`;
--> statement-breakpoint
ALTER TABLE `User` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `NotificationSettings` ADD `followRequests` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `FriendRequest` ADD CONSTRAINT `FriendRequest_senderId_User_id_fk` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `FriendRequest` ADD CONSTRAINT `FriendRequest_recipientId_User_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Follower` ADD CONSTRAINT `Follower_senderId_User_id_fk` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Follower` ADD CONSTRAINT `Follower_recipientId_User_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `FriendRequest` DROP COLUMN `status`;