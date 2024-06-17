ALTER TABLE `User` DROP FOREIGN KEY `User_profile_Profile_id_fk`;
--> statement-breakpoint
ALTER TABLE `User` ADD `phoneNumber` varchar(128) NOT NULL;--> statement-breakpoint
ALTER TABLE `User` ADD CONSTRAINT `User_profile_Profile_id_fk` FOREIGN KEY (`profile`) REFERENCES `Profile`(`id`) ON DELETE cascade ON UPDATE no action;