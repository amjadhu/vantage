CREATE TABLE `analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`type` text NOT NULL,
	`markdown_content` text NOT NULL,
	`article_ids` text,
	`persona_id` text,
	`generated_at` text NOT NULL,
	`model_used` text NOT NULL,
	`token_count` integer,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `article_connections` (
	`id` text PRIMARY KEY NOT NULL,
	`source_article_id` text NOT NULL,
	`target_article_id` text NOT NULL,
	`relationship_type` text NOT NULL,
	`reasoning` text NOT NULL,
	`confidence` real NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`source_article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`target_article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`external_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`content` text NOT NULL,
	`summary` text,
	`author` text,
	`published_at` text NOT NULL,
	`categories` text,
	`metadata` text,
	`fetched_at` text NOT NULL,
	`content_hash` text NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `briefings` (
	`id` text PRIMARY KEY NOT NULL,
	`persona_id` text NOT NULL,
	`markdown_content` text NOT NULL,
	`article_ids` text,
	`generated_at` text NOT NULL,
	`model_used` text NOT NULL,
	`token_count` integer,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `enrichments` (
	`id` text PRIMARY KEY NOT NULL,
	`article_id` text NOT NULL,
	`persona_id` text NOT NULL,
	`executive_summary` text NOT NULL,
	`relevance_score` real NOT NULL,
	`impact_level` text NOT NULL,
	`sentiment` text NOT NULL,
	`entities` text,
	`category_tags` text,
	`key_facts` text,
	`connection_hints` text,
	`enriched_at` text NOT NULL,
	`model_used` text NOT NULL,
	`token_count` integer,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `personas` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`config` text NOT NULL,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pipeline_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`pipeline` text NOT NULL,
	`trigger` text NOT NULL,
	`status` text NOT NULL,
	`token_count` integer DEFAULT 0,
	`items_processed` integer DEFAULT 0,
	`error_message` text,
	`date` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sources` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`url` text NOT NULL,
	`category` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`fetch_interval_minutes` integer DEFAULT 120 NOT NULL,
	`last_fetched_at` text,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trends` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`date` text NOT NULL,
	`mention_count` integer DEFAULT 0 NOT NULL,
	`article_ids` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `watchlist_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`ticker` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`sector` text NOT NULL,
	`description` text NOT NULL,
	`is_main` integer DEFAULT false NOT NULL,
	`metadata` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `watchlist_companies_ticker_unique` ON `watchlist_companies` (`ticker`);--> statement-breakpoint
CREATE UNIQUE INDEX `watchlist_companies_slug_unique` ON `watchlist_companies` (`slug`);