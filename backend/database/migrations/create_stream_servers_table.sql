-- Migration: create_stream_servers_table
-- Updated: 2026-05-27  (Flussonic Media Server schema)

CREATE TABLE IF NOT EXISTS `stream_servers` (
    `id`                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `uuid`               CHAR(36)     NOT NULL UNIQUE  COMMENT 'UUID v4 identifier',

    -- Identity
    `server_name`        VARCHAR(120) NOT NULL          COMMENT 'Friendly server name (e.g. Chennai-Main)',

    -- Connection
    `server_host_ip`     VARCHAR(45)  NOT NULL          COMMENT 'Server IP address',
    `server_host_domain` VARCHAR(255) NULL              COMMENT 'Optional domain (e.g. flussonic.example.com)',

    -- Flussonic API
    `api_port`           INT          NOT NULL DEFAULT 8080  COMMENT 'Flussonic API port',
    `api_version`        VARCHAR(10)  NOT NULL DEFAULT 'v3'  COMMENT 'API version (e.g. v3)',
    `username`           VARCHAR(120) NOT NULL               COMMENT 'API username',
    `password_encrypted` TEXT         NOT NULL               COMMENT 'AES-256 encrypted API password',
    `bearer_token`       TEXT         NULL                   COMMENT 'AES-256 encrypted bearer token (preferred over password when set)',

    -- Location
    `timezone`           VARCHAR(100) NULL DEFAULT 'Asia/Kolkata' COMMENT 'Server timezone',
    `region`             VARCHAR(120) NULL                         COMMENT 'Deployment region (e.g. India South)',

    -- Health & monitoring
    `health_status`      ENUM('online','offline') NOT NULL DEFAULT 'offline',
    `last_ping_at`       TIMESTAMP NULL                    COMMENT 'Last successful liveness check',

    -- Lifecycle
    `status`             ENUM('active','inactive','expired','deleted') NOT NULL DEFAULT 'active',

    -- Audit
    `created_at`         TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `deleted_at`         TIMESTAMP NULL DEFAULT NULL,

    -- Indexes
    INDEX `idx_status`        (`status`),
    INDEX `idx_health_status` (`health_status`),
    INDEX `idx_region`        (`region`),
    INDEX `idx_last_ping`     (`last_ping_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
