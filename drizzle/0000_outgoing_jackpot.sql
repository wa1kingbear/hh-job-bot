CREATE TABLE `blocked_employers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hh_employer_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `blocked_employers_hh_id_unique` ON `blocked_employers` (`hh_employer_id`);--> statement-breakpoint
CREATE TABLE `polling_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`status` text DEFAULT 'running' NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`found_count` integer DEFAULT 0 NOT NULL,
	`new_count` integer DEFAULT 0 NOT NULL,
	`passed_count` integer DEFAULT 0 NOT NULL,
	`notified_count` integer DEFAULT 0 NOT NULL,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vacancy_id` integer NOT NULL,
	`action` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `vacancies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hh_id` text NOT NULL,
	`name` text NOT NULL,
	`employer_id` text,
	`employer_name` text NOT NULL,
	`url` text NOT NULL,
	`salary_from` integer,
	`salary_to` integer,
	`salary_currency` text,
	`salary_gross` integer,
	`remote_status` text NOT NULL,
	`remote_reason` text,
	`location_compatible` integer,
	`experience` text,
	`seniority` text NOT NULL,
	`primary_stack` text,
	`role_focus` text,
	`published_at` integer,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`notified_at` integer,
	`responses_count` integer,
	`responses_source` text,
	`responses_checked_at` integer,
	`rule_score` real,
	`llm_score` real,
	`match_score` real,
	`freshness_score` real,
	`competition_score` real,
	`priority_score` real,
	`processing_status` text DEFAULT 'discovered' NOT NULL,
	`user_status` text DEFAULT 'none' NOT NULL,
	`filter_reason` text,
	`raw_json` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vacancies_hh_id_unique` ON `vacancies` (`hh_id`);--> statement-breakpoint
CREATE TABLE `vacancy_analysis` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`vacancy_id` integer NOT NULL,
	`summary` text NOT NULL,
	`matches_json` text NOT NULL,
	`gaps_json` text NOT NULL,
	`risks_json` text NOT NULL,
	`llm_model` text,
	`confidence` real,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`vacancy_id`) REFERENCES `vacancies`(`id`) ON UPDATE no action ON DELETE cascade
);
