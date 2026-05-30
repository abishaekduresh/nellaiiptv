-- Add protocol column to stream_servers table
-- Stores the preferred connection scheme for each Flussonic server (http/https).
-- Run this migration on existing installs.

ALTER TABLE stream_servers
  ADD COLUMN protocol VARCHAR(5) NOT NULL DEFAULT 'http' AFTER api_version;
