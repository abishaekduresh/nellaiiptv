-- Streams: individual media streams managed by a Flussonic server
CREATE TABLE IF NOT EXISTS `streams` (
  `id`              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `uuid`            CHAR(36)            NOT NULL,
  `server_id`       BIGINT UNSIGNED     NOT NULL,
  `stream_name`     VARCHAR(255)        NOT NULL,
  `input_url`       TEXT                NOT NULL,
  `output_formats`  JSON                NOT NULL,
  `stream_key`      VARCHAR(255)        NULL DEFAULT NULL,
  `health_status`   ENUM('online','offline') NOT NULL DEFAULT 'offline',
  `viewer_limit`    INT UNSIGNED        NOT NULL DEFAULT 1000,
  `current_viewers` INT UNSIGNED        NOT NULL DEFAULT 0,
  `bitrate`         BIGINT UNSIGNED     NOT NULL DEFAULT 0,
  `status`          ENUM('active','inactive','expired','deleted') NOT NULL DEFAULT 'active',
  `created_at`      TIMESTAMP           NULL DEFAULT NULL,
  `updated_at`      TIMESTAMP           NULL DEFAULT NULL,
  `deleted_at`      TIMESTAMP           NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE  KEY `uq_streams_uuid`          (`uuid`),
  INDEX         `idx_streams_server_id`  (`server_id`),
  INDEX         `idx_streams_status`     (`status`),
  INDEX         `idx_streams_health`     (`health_status`),
  CONSTRAINT `fk_streams_server`
    FOREIGN KEY (`server_id`) REFERENCES `stream_servers`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
