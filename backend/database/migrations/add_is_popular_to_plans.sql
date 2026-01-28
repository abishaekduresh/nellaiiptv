-- Add is_popular to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN is_popular TINYINT(1) NOT NULL DEFAULT 0 AFTER status;
