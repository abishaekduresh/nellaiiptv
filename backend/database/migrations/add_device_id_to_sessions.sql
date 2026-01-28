-- Add device_id and browser_info to customer_sessions
ALTER TABLE `customer_sessions` 
ADD COLUMN `device_id` varchar(255) DEFAULT NULL AFTER `customer_id`,
ADD COLUMN `browser_info` text DEFAULT NULL AFTER `platform`;

-- Add index for faster lookup
ALTER TABLE `customer_sessions` ADD INDEX `idx_device_id` (`device_id`);
ALTER TABLE `customer_sessions` ADD INDEX `idx_customer_device` (`customer_id`, `device_id`);
