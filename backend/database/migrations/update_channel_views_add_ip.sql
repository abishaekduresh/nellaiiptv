ALTER TABLE `channel_views` 
ADD COLUMN `client_ip` VARCHAR(45) NOT NULL DEFAULT '0.0.0.0' AFTER `view_date`;

ALTER TABLE `channel_views`
DROP INDEX `unique_channel_date`,
ADD UNIQUE KEY `unique_channel_date_ip` (`channel_id`, `view_date`, `client_ip`);
