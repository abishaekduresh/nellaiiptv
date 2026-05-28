-- Viewer Sessions: per-session playback tracking for each stream
CREATE TABLE IF NOT EXISTS `viewer_sessions` (
  `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `session_id`  VARCHAR(128)     NOT NULL,
  `stream_id`   BIGINT UNSIGNED  NOT NULL,
  `ip_address`  VARCHAR(45)      NOT NULL,
  `country`     VARCHAR(100)     NULL DEFAULT NULL,
  `user_agent`  TEXT             NULL DEFAULT NULL,
  `started_at`  TIMESTAMP        NULL DEFAULT NULL,
  `bandwidth`   BIGINT UNSIGNED  NOT NULL DEFAULT 0,
  `protocol`    ENUM('hls','dash','rtmp','webrtc') NOT NULL DEFAULT 'hls',
  PRIMARY KEY (`id`),
  UNIQUE  KEY `uq_viewer_sessions_session_id` (`session_id`),
  INDEX         `idx_viewer_sessions_stream_id`  (`stream_id`),
  INDEX         `idx_viewer_sessions_started_at` (`started_at`),
  CONSTRAINT `fk_viewer_sessions_stream`
    FOREIGN KEY (`stream_id`) REFERENCES `streams`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
