-- Add Flussonic API v3 stats columns to streams table
-- Maps to /streamer/api/v3/streams response fields

ALTER TABLE `streams`
  -- make input_url nullable (some streams have no input URL e.g. publish://)
  MODIFY COLUMN `input_url` TEXT NULL DEFAULT NULL,
  -- make output_formats nullable
  MODIFY COLUMN `output_formats` JSON NULL DEFAULT NULL,

  -- bandwidth fields
  ADD COLUMN `inputs_bandwidth`  BIGINT UNSIGNED  NULL DEFAULT 0    AFTER `bitrate`,
  ADD COLUMN `out_bandwidth`     BIGINT UNSIGNED  NULL DEFAULT 0    AFTER `inputs_bandwidth`,

  -- client/viewer fields
  ADD COLUMN `online_clients`    INT UNSIGNED     NULL DEFAULT 0    AFTER `out_bandwidth`,

  -- video track info
  ADD COLUMN `video_width`       INT UNSIGNED     NULL DEFAULT NULL AFTER `online_clients`,
  ADD COLUMN `video_height`      INT UNSIGNED     NULL DEFAULT NULL AFTER `video_width`,
  ADD COLUMN `video_codec`       VARCHAR(50)      NULL DEFAULT NULL AFTER `video_height`,
  ADD COLUMN `fps`               DECIMAL(6,2)     NULL DEFAULT NULL AFTER `video_codec`,

  -- audio track info
  ADD COLUMN `audio_codec`       VARCHAR(50)      NULL DEFAULT NULL AFTER `fps`,
  ADD COLUMN `audio_bitrate`     INT UNSIGNED     NULL DEFAULT NULL AFTER `audio_codec`,
  ADD COLUMN `audio_sample_rate` INT UNSIGNED     NULL DEFAULT NULL AFTER `audio_bitrate`,
  ADD COLUMN `audio_channels`    TINYINT UNSIGNED NULL DEFAULT NULL AFTER `audio_sample_rate`,

  -- Flussonic stream runtime status (e.g. "running", "stopped")
  ADD COLUMN `stream_status`     VARCHAR(50)      NULL DEFAULT NULL AFTER `audio_channels`,

  -- publish info
  ADD COLUMN `published_via`     VARCHAR(50)      NULL DEFAULT NULL AFTER `stream_status`,
  ADD COLUMN `published_from`    VARCHAR(100)     NULL DEFAULT NULL AFTER `published_via`,
  ADD COLUMN `client_count`      INT UNSIGNED     NULL DEFAULT 0    AFTER `published_from`,

  -- stream URL type (e.g. "publish://")
  ADD COLUMN `stream_url_type`   VARCHAR(255)     NULL DEFAULT NULL AFTER `client_count`,

  -- max allowed sessions from on_play config
  ADD COLUMN `max_sessions`      INT UNSIGNED     NULL DEFAULT NULL AFTER `stream_url_type`;
