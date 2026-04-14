ALTER TABLE channels 
ADD COLUMN is_preview_public BOOLEAN DEFAULT 0 COMMENT 'Allow public access to preview player without authentication';
