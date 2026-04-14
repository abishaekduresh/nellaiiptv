ALTER TABLE `api_keys` ADD COLUMN `allowed_platforms` SET('web', 'android', 'ios', 'tv') COLLATE utf8mb4_unicode_ci DEFAULT 'web,android,ios,tv' AFTER `status`;
