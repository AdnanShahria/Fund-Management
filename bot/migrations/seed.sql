-- Seed data for Room 302 (FVMAS-16)

-- 1. Create Organization
INSERT OR IGNORE INTO `organizations` (`id`, `name`, `type`, `country`, `currency`, `owner_user_id`, `status`, `created_at`, `updated_at`)
VALUES ('org-1', 'FVMAS-16 Room Collective', 'COMMUNITY', 'BD', 'BDT', 'u-adnan', 'active', 1727740800, 1727740800);

-- 2. Create Group (Room 302)
INSERT OR IGNORE INTO `groups` (`id`, `organization_id`, `parent_group_id`, `name`, `type`, `telegram_chat_id`, `status`, `created_at`, `updated_at`)
VALUES ('grp-room-302', 'org-1', NULL, 'Room 302', 'ROOM', '-10029384756', 'active', 1727740800, 1727740800);

-- 3. Create Fund (Room Fund)
INSERT OR IGNORE INTO `funds` (`id`, `organization_id`, `group_id`, `name`, `type`, `currency`, `opening_balance_paisa`, `status`, `created_at`, `updated_at`)
VALUES ('fund-room-302', 'org-1', 'grp-room-302', 'Room 302 General Fund', 'ROOM', 'BDT', 100000, 'active', 1727740800, 1727740800);

-- 4. Create Users
INSERT OR IGNORE INTO `users` (`id`, `telegram_user_id`, `username`, `display_name`, `avatar_url`, `status`, `created_at`, `updated_at`) VALUES
('u-adnan', '12345678', 'adnan_shahria', 'Adnan Shahria', NULL, 'active', 1727740800, 1727740800),
('u-murad', '23456789', 'murad_hasan', 'Murad Hasan', NULL, 'active', 1727740800, 1727740800),
('u-rahim', '34567890', 'rahim_uddin', 'Rahim Uddin', NULL, 'active', 1727740800, 1727740800),
('u-karim', '45678901', 'karim_sheikh', 'Karim Sheikh', NULL, 'active', 1727740800, 1727740800),
('u-farhan', '56789012', 'farhan_ali', 'Farhan Ali', NULL, 'suspended', 1727740800, 1727740800);

-- 5. Create Memberships
INSERT OR IGNORE INTO `memberships` (`id`, `organization_id`, `group_id`, `fund_id`, `user_id`, `role`, `status`, `joined_at`) VALUES
('mem-1', 'org-1', 'grp-room-302', 'fund-room-302', 'u-adnan', 'TREASURER', 'active', 1727740800),
('mem-2', 'org-1', 'grp-room-302', 'fund-room-302', 'u-murad', 'MEMBER', 'active', 1727740800),
('mem-3', 'org-1', 'grp-room-302', 'fund-room-302', 'u-rahim', 'MEMBER', 'active', 1727740800),
('mem-4', 'org-1', 'grp-room-302', 'fund-room-302', 'u-karim', 'MEMBER', 'active', 1727740800),
('mem-5', 'org-1', 'grp-room-302', 'fund-room-302', 'u-farhan', 'MEMBER', 'suspended', 1727740800);

-- 6. Create Transactions
INSERT OR IGNORE INTO `transactions` (`id`, `organization_id`, `group_id`, `fund_id`, `type`, `member_id`, `amount_paisa`, `currency`, `category`, `description`, `transaction_date`, `created_by`, `source`, `source_telegram_chat_id`, `source_telegram_message_id`, `reverses_transaction_id`, `status`, `created_at`, `updated_at`) VALUES
('tx-1', 'org-1', 'grp-room-302', 'fund-room-302', 'CONTRIBUTION', 'u-adnan', 50000, 'BDT', NULL, 'Monthly contribution', 1727784000, 'u-adnan', 'TELEGRAM', '-10029384756', '101', NULL, 'completed', 1727784000, 1727784000),
('tx-2', 'org-1', 'grp-room-302', 'fund-room-302', 'CONTRIBUTION', 'u-murad', 50000, 'BDT', NULL, 'Monthly contribution', 1727784600, 'u-adnan', 'TELEGRAM', '-10029384756', '102', NULL, 'completed', 1727784600, 1727784600),
('tx-3', 'org-1', 'grp-room-302', 'fund-room-302', 'EXPENSE', NULL, -15000, 'BDT', 'GROCERY', 'Weekly grocery from market', 1727787000, 'u-adnan', 'TELEGRAM', '-10029384756', '105', NULL, 'completed', 1727787000, 1727787000),
('tx-4', 'org-1', 'grp-room-302', 'fund-room-302', 'EXPENSE', NULL, -8000, 'BDT', 'ELECTRICITY', 'September electricity bill share', 1727790600, 'u-adnan', 'WEB', NULL, NULL, NULL, 'completed', 1727790600, 1727790600),
('tx-5', 'org-1', 'grp-room-302', 'fund-room-302', 'CONTRIBUTION', 'u-rahim', 40000, 'BDT', NULL, 'Contribution for grocery and utilities', 1727794200, 'u-adnan', 'TELEGRAM', '-10029384756', '110', NULL, 'completed', 1727794200, 1727794200),
('tx-6', 'org-1', 'grp-room-302', 'fund-room-302', 'EXPENSE', NULL, -3500, 'BDT', 'CLEANING', 'Room floor cleaning liquids and supplies', 1727801400, 'u-adnan', 'TELEGRAM', '-10029384756', '114', NULL, 'completed', 1727801400, 1727801400);
