ALTER TABLE `ReportComment` DROP FOREIGN KEY `ReportComment_commentId_Post_id_fk`;
--> statement-breakpoint
ALTER TABLE `ReportComment` ADD CONSTRAINT `ReportComment_commentId_Comment_id_fk` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE cascade ON UPDATE no action;