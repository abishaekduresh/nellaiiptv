-- ============================================================================
-- Migration: Remove monetization subsystem (plans, transactions, payments,
--            reseller & wallet) — the platform becomes free / open-access.
--
-- Drops:  transactions, subscription_plans, wallet_transactions tables
--         customers.subscription_plan_id, .subscription_expires_at, .wallet_balance
--         gateway_* rows from the settings table
--
-- No enforced foreign-key constraints reference these objects (the *_foreign
-- names on `transactions` are plain indexes; `subscription_plans` is MyISAM),
-- so drop order is unconstrained.
--
-- ⚠️  DESTRUCTIVE — permanently deletes production billing data.
--     Take a FULL backup first (shell, not SQL):
--       mysqldump -u USER -p nellaiiptv > nellaiiptv_pre_billing_removal_20260806.sql
-- ============================================================================

-- 1. Safety backups (survive the drops; delete once the app is verified stable)
CREATE TABLE `_backup_transactions_20260806`        AS SELECT * FROM `transactions`;
CREATE TABLE `_backup_subscription_plans_20260806`  AS SELECT * FROM `subscription_plans`;
CREATE TABLE `_backup_wallet_transactions_20260806` AS SELECT * FROM `wallet_transactions`;
CREATE TABLE `_backup_customers_billing_20260806`   AS
    SELECT `id`, `uuid`, `subscription_plan_id`, `subscription_expires_at`, `wallet_balance`
    FROM `customers`;

-- 2. Drop billing columns from customers
ALTER TABLE `customers`
    DROP COLUMN `subscription_plan_id`,
    DROP COLUMN `subscription_expires_at`,
    DROP COLUMN `wallet_balance`;

-- 3. Drop the tables
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `subscription_plans`;
DROP TABLE IF EXISTS `wallet_transactions`;

-- 4. Remove payment-gateway settings (credentials also live in .env — remove there too)
DELETE FROM `settings` WHERE `setting_key` IN ('gateway_razorpay_enabled','gateway_cashfree_enabled');

-- 5. Once verified stable, drop the backups:
--    DROP TABLE `_backup_transactions_20260806`, `_backup_subscription_plans_20260806`,
--               `_backup_wallet_transactions_20260806`, `_backup_customers_billing_20260806`;

-- ============================================================================
-- ROLLBACK (run only while the _backup_* tables still exist)
-- ============================================================================
-- ALTER TABLE `customers`
--     ADD COLUMN `subscription_plan_id` int NOT NULL DEFAULT 0,
--     ADD COLUMN `subscription_expires_at` datetime NULL,
--     ADD COLUMN `wallet_balance` decimal(10,2) NOT NULL DEFAULT 0.00;
--
-- UPDATE `customers` c
--     JOIN `_backup_customers_billing_20260806` b ON b.id = c.id
--     SET c.subscription_plan_id    = b.subscription_plan_id,
--         c.subscription_expires_at = b.subscription_expires_at,
--         c.wallet_balance          = b.wallet_balance;
--
-- CREATE TABLE `transactions`        AS SELECT * FROM `_backup_transactions_20260806`;
-- CREATE TABLE `subscription_plans`  AS SELECT * FROM `_backup_subscription_plans_20260806`;
-- CREATE TABLE `wallet_transactions` AS SELECT * FROM `_backup_wallet_transactions_20260806`;
-- ============================================================================
