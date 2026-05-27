-- Migration: modify_stream_servers_for_flussonic
-- Description: Replace MistServer-specific schema with Flussonic server fields
-- Created: 2026-05-27

-- ── Step 1: Sanitize enum values before modifying enum columns ────────────────
-- health_status: drop 'warning' and 'maintenance' (Flussonic only tracks online/offline)
UPDATE `stream_servers` SET `health_status` = 'offline' WHERE `health_status` IN ('warning', 'maintenance');
-- status: map 'suspended' to 'inactive'
UPDATE `stream_servers` SET `status` = 'inactive' WHERE `status` = 'suspended';

-- ── Step 2: Drop removed columns ─────────────────────────────────────────────
ALTER TABLE `stream_servers`
  DROP COLUMN IF EXISTS `server_code`,
  DROP COLUMN IF EXISTS `description`,
  DROP COLUMN IF EXISTS `host_ipv6`,
  DROP COLUMN IF EXISTS `mist_api_protocol`,
  DROP COLUMN IF EXISTS `mist_api_host`,
  DROP COLUMN IF EXISTS `mist_challenge`,
  DROP COLUMN IF EXISTS `mist_final_hash`,
  DROP COLUMN IF EXISTS `rtmp_publish_base_url`,
  DROP COLUMN IF EXISTS `hls_base_url`,
  DROP COLUMN IF EXISTS `https_hls_base_url`,
  DROP COLUMN IF EXISTS `cmaf_base_url`,
  DROP COLUMN IF EXISTS `webrtc_base_url`,
  DROP COLUMN IF EXISTS `srt_base_url`,
  DROP COLUMN IF EXISTS `server_type`,
  DROP COLUMN IF EXISTS `provider_name`,
  DROP COLUMN IF EXISTS `country_code`,
  DROP COLUMN IF EXISTS `operating_system`,
  DROP COLUMN IF EXISTS `kernel_version`,
  DROP COLUMN IF EXISTS `cpu_model`,
  DROP COLUMN IF EXISTS `cpu_cores`,
  DROP COLUMN IF EXISTS `cpu_threads`,
  DROP COLUMN IF EXISTS `memory_total_mb`,
  DROP COLUMN IF EXISTS `disk_total_gb`,
  DROP COLUMN IF EXISTS `bandwidth_limit_tb`,
  DROP COLUMN IF EXISTS `network_speed_mbps`,
  DROP COLUMN IF EXISTS `gpu_enabled`,
  DROP COLUMN IF EXISTS `max_streams`,
  DROP COLUMN IF EXISTS `max_viewers`,
  DROP COLUMN IF EXISTS `current_streams`,
  DROP COLUMN IF EXISTS `current_viewers`,
  DROP COLUMN IF EXISTS `purchased_at`,
  DROP COLUMN IF EXISTS `expiry_at`,
  DROP COLUMN IF EXISTS `last_stats_sync_at`,
  DROP COLUMN IF EXISTS `supports_hls`,
  DROP COLUMN IF EXISTS `supports_rtmp`,
  DROP COLUMN IF EXISTS `supports_cmaf`,
  DROP COLUMN IF EXISTS `supports_webrtc`,
  DROP COLUMN IF EXISTS `supports_srt`,
  DROP COLUMN IF EXISTS `supports_transcoding`,
  DROP COLUMN IF EXISTS `api_whitelist_enabled`,
  DROP COLUMN IF EXISTS `ssl_enabled`,
  DROP COLUMN IF EXISTS `notes`;

-- ── Step 3: Rename existing columns ──────────────────────────────────────────
-- Uses CHANGE COLUMN (MySQL 5.7+ compatible)
ALTER TABLE `stream_servers`
  CHANGE COLUMN `host_ipv4`            `server_host_ip`     VARCHAR(45)  NOT NULL,
  CHANGE COLUMN `host_domain`          `server_host_domain` VARCHAR(255) NULL,
  CHANGE COLUMN `mist_api_port`        `api_port`           INT          NOT NULL DEFAULT 8080,
  CHANGE COLUMN `mist_server_username` `username`           VARCHAR(120) NOT NULL,
  CHANGE COLUMN `mist_server_password` `password_encrypted` TEXT         NOT NULL COMMENT 'AES-256 encrypted password',
  CHANGE COLUMN `last_seen_at`         `last_ping_at`        TIMESTAMP    NULL,
  CHANGE COLUMN `datacenter_region`    `region`              VARCHAR(120) NULL;

-- ── Step 4: Modify enum column definitions ────────────────────────────────────
ALTER TABLE `stream_servers`
  MODIFY COLUMN `health_status` ENUM('online','offline') NOT NULL DEFAULT 'offline',
  MODIFY COLUMN `status`        ENUM('active','inactive','expired','deleted') NOT NULL DEFAULT 'active';

-- ── Step 5: Add new Flussonic-specific columns ────────────────────────────────
ALTER TABLE `stream_servers`
  ADD COLUMN `api_version`    VARCHAR(10)  NOT NULL DEFAULT 'v3'           COMMENT 'Flussonic API version (e.g. v3)' AFTER `api_port`,
  ADD COLUMN `bearer_token`   TEXT         NULL                            COMMENT 'AES-256 encrypted bearer token'  AFTER `password_encrypted`,
  ADD COLUMN `timezone`       VARCHAR(100) NULL     DEFAULT 'Asia/Kolkata' COMMENT 'Server timezone'                AFTER `bearer_token`;

-- ── Step 6: Update indexes ────────────────────────────────────────────────────
ALTER TABLE `stream_servers`
  DROP INDEX IF EXISTS `idx_provider`,
  DROP INDEX IF EXISTS `idx_expiry`,
  DROP INDEX IF EXISTS `idx_last_seen`;

CREATE INDEX `idx_region`       ON `stream_servers` (`region`);
CREATE INDEX `idx_last_ping`    ON `stream_servers` (`last_ping_at`);
