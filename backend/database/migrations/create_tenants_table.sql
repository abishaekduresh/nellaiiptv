-- Tenants: B2B customers / reseller organisations using the IPTV platform
CREATE TABLE IF NOT EXISTS `tenants` (
  `id`              BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `uuid`            CHAR(36)         NOT NULL,
  `company_name`    VARCHAR(255)     NOT NULL,
  `email`           VARCHAR(255)     NOT NULL,
  `max_viewers`     INT UNSIGNED     NOT NULL DEFAULT 1000,
  `allowed_servers` JSON             NOT NULL,
  `channel_id`      JSON             NOT NULL,
  `status`          ENUM('active','inactive','expired','deleted') NOT NULL DEFAULT 'active',
  `created_at`      TIMESTAMP        NULL DEFAULT NULL,
  `updated_at`      TIMESTAMP        NULL DEFAULT NULL,
  `deleted_at`      TIMESTAMP        NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE  KEY `uq_tenants_uuid`   (`uuid`),
  INDEX         `idx_tenants_status` (`status`),
  INDEX         `idx_tenants_email`  (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
