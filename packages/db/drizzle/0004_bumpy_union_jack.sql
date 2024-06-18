ALTER TABLE `PushToken` ADD CONSTRAINT `uniqueToken` UNIQUE(`token`);--> statement-breakpoint
ALTER TABLE `PushToken` ADD `updatedAt` timestamp ON UPDATE CURRENT_TIMESTAMP;