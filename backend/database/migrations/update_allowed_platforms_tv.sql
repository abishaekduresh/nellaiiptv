ALTER TABLE channels MODIFY COLUMN allowed_platforms SET('web', 'android', 'ios', 'tv') DEFAULT 'web,android,ios,tv';
