-- Rename display_duration_sec to repeat_count
ALTER TABLE scrolling_ads 
  CHANGE COLUMN display_duration_sec repeat_count INT NOT NULL DEFAULT 3;
