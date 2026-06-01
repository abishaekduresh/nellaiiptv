-- Add geo-enrichment columns from ipwho.is to stream_clients
ALTER TABLE `stream_clients`
  ADD COLUMN `ip_type`        VARCHAR(20)    NULL DEFAULT NULL AFTER `country`,
  ADD COLUMN `continent`      VARCHAR(100)   NULL DEFAULT NULL AFTER `ip_type`,
  ADD COLUMN `continent_code` VARCHAR(10)    NULL DEFAULT NULL AFTER `continent`,
  ADD COLUMN `country_code`   VARCHAR(10)    NULL DEFAULT NULL AFTER `continent_code`,
  ADD COLUMN `region`         VARCHAR(100)   NULL DEFAULT NULL AFTER `country_code`,
  ADD COLUMN `region_code`    VARCHAR(10)    NULL DEFAULT NULL AFTER `region`,
  ADD COLUMN `city`           VARCHAR(100)   NULL DEFAULT NULL AFTER `region_code`,
  ADD COLUMN `latitude`       DECIMAL(10,7)  NULL DEFAULT NULL AFTER `city`,
  ADD COLUMN `longitude`      DECIMAL(10,7)  NULL DEFAULT NULL AFTER `latitude`,
  ADD COLUMN `postal`         VARCHAR(20)    NULL DEFAULT NULL AFTER `longitude`,
  ADD COLUMN `org`            VARCHAR(255)   NULL DEFAULT NULL AFTER `postal`,
  ADD COLUMN `isp`            VARCHAR(255)   NULL DEFAULT NULL AFTER `org`,
  ADD COLUMN `domain`         VARCHAR(255)   NULL DEFAULT NULL AFTER `isp`;
