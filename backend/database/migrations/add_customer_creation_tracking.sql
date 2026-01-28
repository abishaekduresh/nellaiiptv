-- Add customer creation tracking columns
ALTER TABLE customers 
ADD COLUMN created_by_type ENUM('self', 'admin', 'reseller') DEFAULT 'self' AFTER role,
ADD COLUMN created_by_id INT NULL COMMENT 'ID of admin user or reseller customer who created this' AFTER created_by_type;

-- Add index for faster queries
CREATE INDEX idx_created_by ON customers(created_by_type, created_by_id);
