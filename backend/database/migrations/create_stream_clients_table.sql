-- Stream clients synced from /streamer/api/v3/sessions
CREATE TABLE IF NOT EXISTS `stream_clients` (
  `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `uuid`        CHAR(36)         NOT NULL,           -- Flussonic session id
  `stream_id`   BIGINT UNSIGNED  NULL DEFAULT NULL,  -- FK → streams.id
  `stream_name` VARCHAR(255)     NOT NULL,           -- sessions[].name
  `ip`          VARCHAR(45)      NULL DEFAULT NULL,
  `user_agent`  TEXT             NULL DEFAULT NULL,
  `protocol`    VARCHAR(50)      NULL DEFAULT NULL,  -- sessions[].proto
  `opened_at`   BIGINT UNSIGNED  NULL DEFAULT NULL,  -- ms epoch
  `closed_at`   BIGINT UNSIGNED  NULL DEFAULT NULL,  -- ms epoch
  `country`     VARCHAR(10)      NULL DEFAULT NULL,
  `created_at`  TIMESTAMP        NULL DEFAULT NULL,
  `updated_at`  TIMESTAMP        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE  KEY `uq_stream_clients_uuid`        (`uuid`),
  INDEX         `idx_stream_clients_stream_id`   (`stream_id`),
  INDEX         `idx_stream_clients_stream_name` (`stream_name`),
  INDEX         `idx_stream_clients_ip`          (`ip`),
  CONSTRAINT `fk_stream_clients_stream`
    FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
