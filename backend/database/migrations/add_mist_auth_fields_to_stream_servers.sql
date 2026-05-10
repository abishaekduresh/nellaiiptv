-- Migration: add_mist_auth_fields_to_stream_servers
-- Created: 2026-05-10
-- Stores the last known MistServer challenge and final MD5 hash alongside the encrypted password.

ALTER TABLE `stream_servers`
    ADD COLUMN `mist_challenge`  VARCHAR(64)  NULL DEFAULT NULL COMMENT 'Last challenge received from MistServer' AFTER `mist_server_password`,
    ADD COLUMN `mist_final_hash` VARCHAR(32)  NULL DEFAULT NULL COMMENT 'Last computed MD5 auth hash (challenge-response)' AFTER `mist_challenge`;
