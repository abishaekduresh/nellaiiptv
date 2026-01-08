-- Disable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Truncate tables
TRUNCATE TABLE customer_sessions;
TRUNCATE TABLE customer_activity_logs;

-- Modify customer_sessions
-- Drop existing foreign key first (wrapped in a block to handle potential non-existence if needed, but standard MySQL usually just Errors if not found. We'll try just dropping it).
-- Note: existing constraint name is 'fk_session_customer' based on db.sql
ALTER TABLE customer_sessions DROP FOREIGN KEY fk_session_customer;
ALTER TABLE customer_sessions DROP COLUMN customer_uuid;
ALTER TABLE customer_sessions ADD COLUMN customer_id INT UNSIGNED NOT NULL AFTER id;
ALTER TABLE customer_sessions ADD CONSTRAINT fk_sessions_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Modify customer_activity_logs
-- No ID FK existed, so just swap columns
ALTER TABLE customer_activity_logs DROP COLUMN customer_uuid;
ALTER TABLE customer_activity_logs ADD COLUMN customer_id INT UNSIGNED NOT NULL AFTER id;
ALTER TABLE customer_activity_logs ADD CONSTRAINT fk_logs_customer_id FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;
