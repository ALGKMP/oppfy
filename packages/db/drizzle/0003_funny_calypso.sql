ALTER TABLE `Post` RENAME COLUMN `body` TO `caption`;--> statement-breakpoint
ALTER TABLE `Post` MODIFY COLUMN `caption` text;