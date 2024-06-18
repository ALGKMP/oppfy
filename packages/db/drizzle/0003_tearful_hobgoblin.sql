CREATE TABLE `PushToken` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`token` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `PushToken_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `PushToken` ADD CONSTRAINT `PushToken_userId_User_id_fk` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `User` DROP COLUMN `pushToken`;