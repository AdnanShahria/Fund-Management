CREATE TABLE `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`owner_user_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organizations_slug_unique` ON `organizations` (`slug`);--> statement-breakpoint
CREATE TABLE `funds` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`description` text,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`aum` text DEFAULT '0.00' NOT NULL,
	`inception_date` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `share_classes` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`fund_id` text NOT NULL,
	`name` text NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`management_fee_rate` text DEFAULT '0.02' NOT NULL,
	`performance_fee_rate` text DEFAULT '0.20' NOT NULL,
	`min_investment` text DEFAULT '100000.00' NOT NULL,
	`nav_per_share` text DEFAULT '100.000000' NOT NULL,
	`total_shares` text DEFAULT '0' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `investors` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`type` text DEFAULT 'individual' NOT NULL,
	`kyc_status` text DEFAULT 'pending' NOT NULL,
	`tax_id` text,
	`country` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `capital_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`investor_id` text NOT NULL,
	`fund_id` text NOT NULL,
	`share_class_id` text NOT NULL,
	`shares_owned` text DEFAULT '0' NOT NULL,
	`current_balance` text DEFAULT '0.00' NOT NULL,
	`total_invested` text DEFAULT '0.00' NOT NULL,
	`total_withdrawn` text DEFAULT '0.00' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`investor_id`) REFERENCES `investors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`share_class_id`) REFERENCES `share_classes`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`fund_id` text NOT NULL,
	`share_class_id` text,
	`investor_id` text,
	`type` text NOT NULL,
	`amount` text NOT NULL,
	`shares` text,
	`price_per_share` text,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`transaction_date` text NOT NULL,
	`reference_number` text,
	`notes` text,
	`created_by` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`fund_id`) REFERENCES `funds`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`share_class_id`) REFERENCES `share_classes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`investor_id`) REFERENCES `investors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`org_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`details` text,
	`ip_address` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`org_id`) REFERENCES `organizations`(`id`) ON UPDATE no action ON DELETE no action
);
