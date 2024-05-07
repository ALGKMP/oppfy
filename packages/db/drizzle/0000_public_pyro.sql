CREATE TABLE `Blocked` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`blockedUserId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `Blocked_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Comment` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`user` varchar(255) NOT NULL,
	`postId` bigint unsigned NOT NULL,
	`body` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Comment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `FriendRequest` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`requesterId` varchar(255) NOT NULL,
	`requestedId` varchar(255) NOT NULL,
	`status` enum('pending','accepted','declined') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `FriendRequest_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Follower` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`followerId` varchar(255) NOT NULL,
	`followedId` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `Follower_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Friend` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId1` varchar(255) NOT NULL,
	`userId2` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `Friend_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Like` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`postId` bigint unsigned NOT NULL,
	`user` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `Like_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `NotificationSettings` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`posts` boolean NOT NULL DEFAULT true,
	`mentions` boolean NOT NULL DEFAULT true,
	`comments` boolean NOT NULL DEFAULT true,
	`likes` boolean NOT NULL DEFAULT true,
	`friendRequests` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `NotificationSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Post` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`author` varchar(255) NOT NULL,
	`recipient` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`url` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `PostStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `Profile` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`fullName` varchar(255),
	`dateOfBirth` date,
	`bio` text,
	`profilePicture` bigint unsigned NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `Profile_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ProfilePicture` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`url` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ProfilePicture_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `User` (
	`id` varchar(255) NOT NULL,
	`profile` bigint unsigned NOT NULL,
	`username` varchar(255),
	`notificationSettingsId` bigint unsigned NOT NULL,
	`privacySetting` enum('public','private') NOT NULL DEFAULT 'public',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `User_id` PRIMARY KEY(`id`),
	CONSTRAINT `User_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `VerificationToken` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`token` varchar(255) NOT NULL,
	`expires` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `VerificationToken_id` PRIMARY KEY(`id`),
	CONSTRAINT `VerificationToken_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `Blocked` ADD CONSTRAINT `Blocked_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Blocked` ADD CONSTRAINT `Blocked_blockedUserId_User_id_fk` FOREIGN KEY (`blockedUserId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_user_User_id_fk` FOREIGN KEY (`user`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_postId_Post_id_fk` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `FriendRequest` ADD CONSTRAINT `FriendRequest_requesterId_User_id_fk` FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `FriendRequest` ADD CONSTRAINT `FriendRequest_requestedId_User_id_fk` FOREIGN KEY (`requestedId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Follower` ADD CONSTRAINT `Follower_followerId_User_id_fk` FOREIGN KEY (`followerId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Follower` ADD CONSTRAINT `Follower_followedId_User_id_fk` FOREIGN KEY (`followedId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Friend` ADD CONSTRAINT `Friend_userId1_User_id_fk` FOREIGN KEY (`userId1`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Friend` ADD CONSTRAINT `Friend_userId2_User_id_fk` FOREIGN KEY (`userId2`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Like` ADD CONSTRAINT `Like_postId_Post_id_fk` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Like` ADD CONSTRAINT `Like_user_User_id_fk` FOREIGN KEY (`user`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Post` ADD CONSTRAINT `Post_author_User_id_fk` FOREIGN KEY (`author`) REFERENCES `User`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Post` ADD CONSTRAINT `Post_recipient_User_id_fk` FOREIGN KEY (`recipient`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `PostStats` ADD CONSTRAINT `PostStats_postId_Post_id_fk` FOREIGN KEY (`postId`) REFERENCES `Post`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `Profile` ADD CONSTRAINT `Profile_profilePicture_ProfilePicture_id_fk` FOREIGN KEY (`profilePicture`) REFERENCES `ProfilePicture`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `User` ADD CONSTRAINT `User_profile_Profile_id_fk` FOREIGN KEY (`profile`) REFERENCES `Profile`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `User` ADD CONSTRAINT `User_notificationSettingsId_NotificationSettings_id_fk` FOREIGN KEY (`notificationSettingsId`) REFERENCES `NotificationSettings`(`id`) ON DELETE cascade ON UPDATE no action;