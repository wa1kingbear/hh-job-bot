CREATE TABLE `oauth_authorization_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`state_hash` text NOT NULL,
	`encrypted_code_verifier` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_authorization_requests_state_hash_unique` ON `oauth_authorization_requests` (`state_hash`);--> statement-breakpoint
CREATE TABLE `oauth_tokens` (
	`id` integer PRIMARY KEY NOT NULL,
	`encrypted_access_token` text NOT NULL,
	`encrypted_refresh_token` text,
	`token_type` text NOT NULL,
	`expires_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
