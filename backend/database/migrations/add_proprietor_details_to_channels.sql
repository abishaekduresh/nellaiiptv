-- Add proprietor/owner details to channels table
ALTER TABLE `channels` 
ADD COLUMN `proprietor_name` VARCHAR(100) NULL AFTER `allowed_platforms`,
ADD COLUMN `proprietor_phone` VARCHAR(20) NULL AFTER `proprietor_name`,
ADD COLUMN `proprietor_email` VARCHAR(100) NULL AFTER `proprietor_phone`,
ADD COLUMN `proprietor_address` TEXT NULL AFTER `proprietor_email`,
ADD COLUMN `user_agent` VARCHAR(255) NULL AFTER `proprietor_address`,
ADD COLUMN `referer` VARCHAR(255) NULL AFTER `user_agent`;
