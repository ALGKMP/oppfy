CREATE TABLE `Blocked` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`blockedUserId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Blocked_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Comment` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user` varchar(255) NOT NULL,
	`postId` bigint unsigned NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Comment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Contact` (
	`id` varbinary(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Contact_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `FollowRequest` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`recipientId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `FollowRequest_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Follower` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`recipientId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Follower_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Friend` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId1` varchar(255) NOT NULL,
	`userId2` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Friend_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `FriendRequest` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`recipientId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `FriendRequest_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Like` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`postId` bigint unsigned NOT NULL,
	`user` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Like_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `NotificationSettings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`posts` boolean NOT NULL DEFAULT true,
	`likes` boolean NOT NULL DEFAULT true,
	`mentions` boolean NOT NULL DEFAULT true,
	`comments` boolean NOT NULL DEFAULT true,
	`followRequests` boolean NOT NULL DEFAULT true,
	`friendRequests` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `NotificationSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Notifications` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`senderId` varchar(255) NOT NULL,
	`recipientId` varchar(255) NOT NULL,
	`read` boolean NOT NULL DEFAULT false,
	`eventType` enum('like','post','comment','follow','friend','followRequest','friendRequest') NOT NULL,
	`test` varchar(255),
	`entityId` varchar(255),
	`type` enum('post','profile','comment'),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Post` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`author` varchar(255) NOT NULL,
	`recipient` varchar(255) NOT NULL,
	`caption` text NOT NULL DEFAULT (''),
	`url` varchar(255) NOT NULL,
	`mediaType` enum('image','video') NOT NULL DEFAULT 'image',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Post_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `PostStats` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`postId` bigint unsigned NOT NULL,
	`likes` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `PostStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Profile` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`username` varchar(255),
	`fullName` varchar(255),
	`dateOfBirth` date,
	`bio` text,
	`profilePictureKey` varchar(255) NOT NULL DEFAULT 'profile-pictures/default.jpg',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Profile_id` PRIMARY KEY(`id`),
	CONSTRAINT `Profile_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `ReportPost` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`postId` bigint unsigned NOT NULL,
	`reporterUserId` varchar(255) NOT NULL,
	`reason` enum('It offends me','Nudity or sexual activity','Hate speech or symbols','Bullying or harassment') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ReportPost_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ReportProfile` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`targetUserId` varchar(255) NOT NULL,
	`reporterUsdId` varchar(255) NOT NULL,
	`reason` enum('Posting explicit content','Under the age of 13','Catfish account','Scam/spam account') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ReportProfile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` varchar(255) NOT NULL,
	`profile` bigint unsigned NOT NULL,
	`notificationSettingsId` bigint unsigned NOT NULL,
	`privacySetting` enum('public','private') NOT NULL DEFAULT 'public',
	`pushToken` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `User_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `UserContact` (
	`userId` varchar(255) NOT NULL,
	`contactId` varbinary(512) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `UserContact_userId_contactId_pk` PRIMARY KEY(`userId`,`contactId`)
);
--> statement-breakpoint
ALTER TABLE `Blocked` ADD CONSTRAINT `Blocked_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Blocked` ADD CONSTRAINT `Blocked_blockedUserId_User_id_fk` FOREIGN KEY (`blockedUserId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_user_User_id_fk` FOREIGN KEY (`user`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_postId_Post_id_fk` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `FollowRequest` ADD CONSTRAINT `FollowRequest_senderId_User_id_fk` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `FollowRequest` ADD CONSTRAINT `FollowRequest_recipientId_User_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Follower` ADD CONSTRAINT `Follower_senderId_User_id_fk` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Follower` ADD CONSTRAINT `Follower_recipientId_User_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Friend` ADD CONSTRAINT `Friend_userId1_User_id_fk` FOREIGN KEY (`userId1`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Friend` ADD CONSTRAINT `Friend_userId2_User_id_fk` FOREIGN KEY (`userId2`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `FriendRequest` ADD CONSTRAINT `FriendRequest_senderId_User_id_fk` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `FriendRequest` ADD CONSTRAINT `FriendRequest_recipientId_User_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Like` ADD CONSTRAINT `Like_postId_Post_id_fk` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Like` ADD CONSTRAINT `Like_user_User_id_fk` FOREIGN KEY (`user`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_senderId_User_id_fk` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Notifications` ADD CONSTRAINT `Notifications_recipientId_User_id_fk` FOREIGN KEY (`recipientId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Post` ADD CONSTRAINT `Post_author_User_id_fk` FOREIGN KEY (`author`) REFERENCES `User`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Post` ADD CONSTRAINT `Post_recipient_User_id_fk` FOREIGN KEY (`recipient`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `PostStats` ADD CONSTRAINT `PostStats_postId_Post_id_fk` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ReportPost` ADD CONSTRAINT `ReportPost_postId_Post_id_fk` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ReportPost` ADD CONSTRAINT `ReportPost_reporterUserId_User_id_fk` FOREIGN KEY (`reporterUserId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ReportProfile` ADD CONSTRAINT `ReportProfile_targetUserId_User_id_fk` FOREIGN KEY (`targetUserId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ReportProfile` ADD CONSTRAINT `ReportProfile_reporterUsdId_User_id_fk` FOREIGN KEY (`reporterUsdId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `User` ADD CONSTRAINT `User_profile_Profile_id_fk` FOREIGN KEY (`profile`) REFERENCES `Profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `User` ADD CONSTRAINT `User_notificationSettingsId_NotificationSettings_id_fk` FOREIGN KEY (`notificationSettingsId`) REFERENCES `NotificationSettings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `UserContact` ADD CONSTRAINT `UserContact_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `UserContact` ADD CONSTRAINT `UserContact_contactId_Contact_id_fk` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE cascade ON UPDATE no action;