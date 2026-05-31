-- Maps customers to their assigned streams (many-to-many)
CREATE TABLE IF NOT EXISTS `customer_stream_assignments` (
  `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `customer_id` INT UNSIGNED     NOT NULL,
  `stream_id`   BIGINT UNSIGNED  NOT NULL,
  `assigned_at` TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE  KEY `uq_csa_customer_stream` (`customer_id`, `stream_id`),
  INDEX         `idx_csa_customer_id`  (`customer_id`),
  INDEX         `idx_csa_stream_id`    (`stream_id`),
  CONSTRAINT `fk_csa_customer`
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_csa_stream`
    FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
