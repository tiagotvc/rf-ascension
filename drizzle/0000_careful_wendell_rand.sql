CREATE TABLE `forum_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`topic_id` integer NOT NULL,
	`body` text NOT NULL,
	`author_name` text NOT NULL,
	`author_email` text NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL,
	FOREIGN KEY (`topic_id`) REFERENCES `forum_topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `forum_posts_topic_id_idx` ON `forum_posts` (`topic_id`);--> statement-breakpoint
CREATE TABLE `forum_topics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`forum_slug` text NOT NULL,
	`title` text NOT NULL,
	`author_name` text NOT NULL,
	`author_email` text NOT NULL,
	`pinned` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `forum_topics_forum_slug_idx` ON `forum_topics` (`forum_slug`);