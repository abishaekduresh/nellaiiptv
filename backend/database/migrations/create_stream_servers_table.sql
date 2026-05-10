-- Migration: create_stream_servers_table
-- Created: 2026-05-10

CREATE TABLE IF NOT EXISTS `stream_servers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Unique identifiers
    `uuid` CHAR(36) NOT NULL UNIQUE COMMENT 'UUID v4 identifier',

    -- Server identity
    `server_name` VARCHAR(120) NOT NULL,
    `server_code` VARCHAR(50) NULL UNIQUE COMMENT 'Short internal identifier',
    `description` TEXT NULL,

    -- Server connection details
    `host_ipv4` VARCHAR(45) NOT NULL,
    `host_ipv6` VARCHAR(100) NULL,
    `host_domain` VARCHAR(255) NULL,

    -- MistServer API details
    `mist_api_protocol` ENUM('http','https') DEFAULT 'http',
    `mist_api_host` VARCHAR(255) NOT NULL,
    `mist_api_port` INT NOT NULL DEFAULT 4242,

    `mist_server_username` VARCHAR(120) NOT NULL,
    `mist_server_password` TEXT NOT NULL COMMENT 'AES-256 encrypted plaintext password',
    `mist_challenge`       VARCHAR(64)  NULL DEFAULT NULL COMMENT 'Last challenge received from MistServer',
    `mist_final_hash`      VARCHAR(32)  NULL DEFAULT NULL COMMENT 'Last computed MD5 auth hash (MD5(MD5(password)+challenge))',

    -- Streaming endpoints
    `rtmp_publish_base_url` VARCHAR(500) NULL,
    `hls_base_url` VARCHAR(500) NULL,
    `https_hls_base_url` VARCHAR(500) NULL,
    `cmaf_base_url` VARCHAR(500) NULL,
    `webrtc_base_url` VARCHAR(500) NULL,
    `srt_base_url` VARCHAR(500) NULL,

    -- Infrastructure info
    `server_type` ENUM('vps','dedicated','cloud','baremetal') NOT NULL DEFAULT 'vps',

    `provider_name` VARCHAR(120) NULL COMMENT 'OVH, Hetzner, Contabo etc',
    `datacenter_region` VARCHAR(120) NULL COMMENT 'Singapore, France, Chennai',
    `country_code` CHAR(2) NULL,

    `operating_system` VARCHAR(120) NULL,
    `kernel_version` VARCHAR(120) NULL,

    -- Hardware specifications
    `cpu_model` VARCHAR(255) NULL,
    `cpu_cores` INT NULL,
    `cpu_threads` INT NULL,

    `memory_total_mb` BIGINT NULL,
    `disk_total_gb` BIGINT NULL,
    `bandwidth_limit_tb` DECIMAL(10,2) NULL COMMENT 'Monthly bandwidth limit',
    `network_speed_mbps` INT NULL,

    `gpu_enabled` BOOLEAN DEFAULT FALSE,

    -- Monitoring & capacity
    `max_streams` INT NULL,
    `max_viewers` INT NULL,

    `current_streams` INT DEFAULT 0,
    `current_viewers` INT DEFAULT 0,

    `health_status` ENUM(
        'online',
        'offline',
        'warning',
        'maintenance'
    ) DEFAULT 'offline',

    -- Server lifecycle
    `purchased_at` TIMESTAMP NULL,
    `expiry_at` TIMESTAMP NULL,

    `last_seen_at` TIMESTAMP NULL,
    `last_stats_sync_at` TIMESTAMP NULL,

    -- Feature flags
    `supports_hls` BOOLEAN DEFAULT TRUE,
    `supports_rtmp` BOOLEAN DEFAULT TRUE,
    `supports_cmaf` BOOLEAN DEFAULT TRUE,
    `supports_webrtc` BOOLEAN DEFAULT FALSE,
    `supports_srt` BOOLEAN DEFAULT FALSE,
    `supports_transcoding` BOOLEAN DEFAULT FALSE,

    -- Security
    `api_whitelist_enabled` BOOLEAN DEFAULT FALSE,
    `ssl_enabled` BOOLEAN DEFAULT FALSE,

    -- Admin status
    `status` ENUM(
        'active',
        'inactive',
        'expired',
        'suspended',
        'deleted'
    ) DEFAULT 'active',

    `notes` TEXT NULL,

    -- Audit timestamps
    `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at` TIMESTAMP NULL DEFAULT NULL,

    -- Indexes
    INDEX `idx_status` (`status`),
    INDEX `idx_health_status` (`health_status`),
    INDEX `idx_provider` (`provider_name`),
    INDEX `idx_expiry` (`expiry_at`),
    INDEX `idx_last_seen` (`last_seen_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
