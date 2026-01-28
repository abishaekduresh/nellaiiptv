-- Add reseller_price and features to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN reseller_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER price,
ADD COLUMN features JSON DEFAULT NULL AFTER platform_access;
