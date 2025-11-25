-- Add is_featured column to channels table
ALTER TABLE `channels` 
ADD COLUMN `is_featured` TINYINT(1) NOT NULL DEFAULT 0 AFTER `viewers_count`;

-- Create index for better query performance
CREATE INDEX `idx_is_featured` ON `channels` (`is_featured`, `status`);
