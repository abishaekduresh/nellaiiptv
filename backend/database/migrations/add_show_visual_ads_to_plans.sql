-- Add video-ad toggle to subscription plans.
-- 0 = plan is ad-free (premium), 1 = plan includes video ads (free/basic).
ALTER TABLE subscription_plans
    ADD COLUMN show_visual_ads TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '1 = show video pre-roll ads to users on this plan; 0 = ad-free'
    AFTER features;
