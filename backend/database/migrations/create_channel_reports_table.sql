-- Create channel_reports table (MyISAM compatible - no foreign keys)
CREATE TABLE IF NOT EXISTS `channel_reports` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `channel_id` INT NOT NULL,
  `customer_id` INT NULL,
  `issue_type` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `status` ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_channel_id` (`channel_id`),
  KEY `idx_customer_id` (`customer_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
