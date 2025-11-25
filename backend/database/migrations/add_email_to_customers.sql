ALTER TABLE `customers` ADD COLUMN `email` varchar(100) COLLATE utf8mb4_unicode_ci AFTER `name`;
ALTER TABLE `customers` ADD UNIQUE KEY `email` (`email`);
ALTER TABLE `customers` ADD COLUMN `reset_token` varchar(100) COLLATE utf8mb4_unicode_ci NULL AFTER `status`;
ALTER TABLE `customers` ADD COLUMN `reset_token_expiry` datetime NULL AFTER `reset_token`;
