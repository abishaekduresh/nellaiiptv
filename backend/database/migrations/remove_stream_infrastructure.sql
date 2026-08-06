-- ============================================================================
-- Migration: Remove the Flussonic stream-hosting infrastructure
--            (stream servers, streams, monitoring, client sessions, customer
--             stream assignments) and its cron automation.
--
-- Drops 5 tables. `streams` has an enforced FK to `stream_servers`
-- (ON DELETE RESTRICT) and the others chain off it, so tables MUST be dropped
-- children-first in the order below.
--
--   customer_stream_assignments  (FK → customers, streams)
--   stream_clients               (FK → streams)
--   server_monitoring            (FK → stream_servers)
--   streams                      (FK → stream_servers, RESTRICT)
--   stream_servers               (parent)
--
-- ⚠️  DESTRUCTIVE — take a FULL backup first:
--       mysqldump -u USER -p nellaiiptv > nellaiiptv_pre_stream_removal_20260806.sql
-- ============================================================================

-- 1. Safety backups (survive the drops; delete once verified stable)
CREATE TABLE `_backup_customer_stream_assignments_20260806` AS SELECT * FROM `customer_stream_assignments`;
CREATE TABLE `_backup_stream_clients_20260806`              AS SELECT * FROM `stream_clients`;
CREATE TABLE `_backup_server_monitoring_20260806`           AS SELECT * FROM `server_monitoring`;
CREATE TABLE `_backup_streams_20260806`                     AS SELECT * FROM `streams`;
CREATE TABLE `_backup_stream_servers_20260806`              AS SELECT * FROM `stream_servers`;

-- 2. Drop the tables (children first to satisfy the RESTRICT FK)
DROP TABLE IF EXISTS `customer_stream_assignments`;
DROP TABLE IF EXISTS `stream_clients`;
DROP TABLE IF EXISTS `server_monitoring`;
DROP TABLE IF EXISTS `streams`;
DROP TABLE IF EXISTS `stream_servers`;

-- 3. Remove the now-orphaned automation settings
DELETE FROM `settings` WHERE `setting_key` IN
    ('stream_server_ping_interval', 'stream_server_last_ping_run', 'cron_secret');

-- 4. Once verified stable, drop the backups:
--    DROP TABLE `_backup_customer_stream_assignments_20260806`, `_backup_stream_clients_20260806`,
--               `_backup_server_monitoring_20260806`, `_backup_streams_20260806`,
--               `_backup_stream_servers_20260806`;

-- ============================================================================
-- ROLLBACK (run only while the _backup_* tables still exist)
-- Recreate parents first, then children. NOTE: `AS SELECT` restores structure +
-- data but not the original PK / FK constraints — re-add them from db.sql if
-- strict referential integrity is required.
-- ============================================================================
-- CREATE TABLE `stream_servers`              AS SELECT * FROM `_backup_stream_servers_20260806`;
-- CREATE TABLE `streams`                     AS SELECT * FROM `_backup_streams_20260806`;
-- CREATE TABLE `server_monitoring`           AS SELECT * FROM `_backup_server_monitoring_20260806`;
-- CREATE TABLE `stream_clients`              AS SELECT * FROM `_backup_stream_clients_20260806`;
-- CREATE TABLE `customer_stream_assignments` AS SELECT * FROM `_backup_customer_stream_assignments_20260806`;
-- ============================================================================
