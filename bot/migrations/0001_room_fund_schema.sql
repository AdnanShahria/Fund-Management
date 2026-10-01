-- Migration 0001: Room Fund Management PRD Schema
-- Replaces old institutional schema with Room and Group Fund model

DROP TABLE IF EXISTS `capital_accounts`;
DROP TABLE IF EXISTS `share_classes`;
DROP TABLE IF EXISTS `investors`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `funds`;
DROP TABLE IF EXISTS `organizations`;

CREATE TABLE IF NOT EXISTS `users` (
	`id` text PRIMARY KEY NOT NULL,
	`telegram_user_id` text UNIQUE,
	`username` text,
	`display_name` text NOT NULL,
	`avatar_url` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `organizations` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'OTHER' NOT NULL,
	`country` text,
	`currency` text DEFAULT 'BDT' NOT NULL,
	`owner_user_id` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `groups` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`parent_group_id` text,
	`name` text NOT NULL,
	`type` text DEFAULT 'OTHER' NOT NULL,
	`telegram_chat_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `funds` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`group_id` text NOT NULL,
	`name` text NOT NULL,
	`type` text DEFAULT 'GENERAL' NOT NULL,
	`currency` text DEFAULT 'BDT' NOT NULL,
	`opening_balance_paisa` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `memberships` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`group_id` text,
	`fund_id` text,
	`user_id` text NOT NULL,
	`role` text DEFAULT 'MEMBER' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`joined_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`group_id` text NOT NULL,
	`fund_id` text NOT NULL,
	`type` text NOT NULL,
	`member_id` text,
	`amount_paisa` integer NOT NULL,
	`currency` text DEFAULT 'BDT' NOT NULL,
	`category` text,
	`description` text,
	`transaction_date` integer NOT NULL,
	`created_by` text NOT NULL,
	`source` text DEFAULT 'TELEGRAM' NOT NULL,
	`source_telegram_chat_id` text,
	`source_telegram_message_id` text,
	`reverses_transaction_id` text,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`group_id` text,
	`fund_id` text,
	`actor_user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`metadata` text,
	`created_at` integer NOT NULL
);

CREATE TABLE IF NOT EXISTS `telegram_updates` (
	`id` text PRIMARY KEY NOT NULL,
	`telegram_chat_id` text NOT NULL,
	`telegram_message_id` text NOT NULL,
	`telegram_update_id` text NOT NULL UNIQUE,
	`processed_at` integer NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS `idx_telegram_updates_chat_msg` ON `telegram_updates` (`telegram_chat_id`, `telegram_message_id`);
CREATE INDEX IF NOT EXISTS `idx_transactions_chat` ON `transactions` (`source_telegram_chat_id`);
CREATE INDEX IF NOT EXISTS `idx_transactions_fund` ON `transactions` (`fund_id`);
CREATE INDEX IF NOT EXISTS `idx_groups_telegram_chat` ON `groups` (`telegram_chat_id`);
CREATE INDEX IF NOT EXISTS `idx_memberships_user_group` ON `memberships` (`user_id`, `group_id`);
