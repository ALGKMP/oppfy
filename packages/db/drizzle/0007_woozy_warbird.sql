CREATE TABLE `ReportComment` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`commentId` bigint unsigned NOT NULL,
	`reporterUserId` varchar(255) NOT NULL,
	`reason` enum('Violent or abusive','Sexually explicit or predatory','Hate, harassment or bullying','Suicide and self-harm','Spam or scam','Other') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ReportComment_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ReportPost` MODIFY COLUMN `reason` enum('Violent or abusive','Sexually explicit or predatory','Hate, harassment or bullying','Suicide and self-harm','Spam or scam','Other') NOT NULL;--> statement-breakpoint
ALTER TABLE `ReportComment` ADD CONSTRAINT `ReportComment_commentId_Post_id_fk` FOREIGN KEY (`commentId`) REFERENCES `Post`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ReportComment` ADD CONSTRAINT `ReportComment_reporterUserId_User_id_fk` FOREIGN KEY (`reporterUserId`) REFERENCES `User`(`id`) ON DELETE cascade ON UPDATE no action;