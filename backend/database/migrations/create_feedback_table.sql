-- Migration: Create feedback table
-- Date: 2026-05-01

CREATE TABLE IF NOT EXISTS `feedback` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `customer_id` int unsigned DEFAULT NULL,
  `feedback_type` enum('general','bug','feature_request','channel_issue','subscription') NOT NULL DEFAULT 'general',
  `rating` tinyint(1) DEFAULT NULL COMMENT '1-5 star rating',
  `issue_type` varchar(100) DEFAULT NULL COMMENT 'For channel_issue type: stream_not_working, buffering_frequently, audio_issue, video_quality_issue, wrong_channel, other',
  `message` text NOT NULL,
  `platform` varchar(20) NOT NULL DEFAULT 'web' COMMENT 'From X-Client-Platform header: web, android, ios, tv, mobile',
  `status` enum('new','reviewed','resolved') NOT NULL DEFAULT 'new',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `idx_feedback_customer` (`customer_id`),
  KEY `idx_feedback_status` (`status`),
  KEY `idx_feedback_type` (`feedback_type`),
  CONSTRAINT `fk_feedback_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
