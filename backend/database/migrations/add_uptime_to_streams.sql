-- Add uptime column to streams table
-- Stores seconds the stream has been running.
-- Source priority: stats.lifetime → stats.uptime / alive_time / run_time → computed from stats.start_time
ALTER TABLE `streams`
  ADD COLUMN `uptime` BIGINT UNSIGNED NULL DEFAULT NULL AFTER `max_sessions`;
