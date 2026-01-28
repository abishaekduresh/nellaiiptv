-- Add show_to column to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN show_to ENUM('customer', 'reseller', 'both') NOT NULL DEFAULT 'both' AFTER status;
