-- Server Monitoring: periodic snapshots of Flussonic server metrics
CREATE TABLE IF NOT EXISTS `server_monitoring` (
  `id`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid`           CHAR(36)        NOT NULL,
  `server_id`      BIGINT UNSIGNED NOT NULL,
  `cpu_usage`      DECIMAL(5,2)    NOT NULL DEFAULT 0.00,
  `ram_usage`      DECIMAL(5,2)    NOT NULL DEFAULT 0.00,
  `disk_usage`     DECIMAL(5,2)    NOT NULL DEFAULT 0.00,
  `network_in`     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `network_out`    BIGINT UNSIGNED NOT NULL DEFAULT 0,
  `active_streams` INT UNSIGNED    NOT NULL DEFAULT 0,
  `active_viewers` INT UNSIGNED    NOT NULL DEFAULT 0,
  `recorded_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE  KEY `uq_server_monitoring_uuid`         (`uuid`),
  INDEX         `idx_server_monitoring_server_id`  (`server_id`),
  INDEX         `idx_server_monitoring_recorded_at`(`recorded_at`),
  CONSTRAINT `fk_server_monitoring_server`
    FOREIGN KEY (`server_id`) REFERENCES `stream_servers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
