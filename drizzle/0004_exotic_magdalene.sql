CREATE TABLE `team_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`role` varchar(20) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_emails_id` PRIMARY KEY(`id`),
	CONSTRAINT `team_emails_name_unique` UNIQUE(`name`)
);
