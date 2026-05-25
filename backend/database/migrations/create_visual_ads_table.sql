CREATE TABLE IF NOT EXISTS visual_ads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,

    -- Content
    title VARCHAR(255) NOT NULL                  COMMENT 'Admin label / ad headline shown to viewer',
    description VARCHAR(500) NULL                COMMENT 'Short sub-text shown below the title during playback',
    ad_url VARCHAR(2048) NOT NULL                COMMENT 'Stream URL — .m3u8 (HLS) or .mp4',
    click_url VARCHAR(2048) NULL                 COMMENT 'Click-through destination when viewer taps the ad',
    thumbnail_url VARCHAR(2048) NULL             COMMENT 'Poster image shown before ad video starts',

    -- Skip behaviour
    is_skippable TINYINT(1) NOT NULL DEFAULT 1   COMMENT '1 = viewer can skip; 0 = forced watch',
    skip_after_seconds INT NOT NULL DEFAULT 5    COMMENT 'Seconds of mandatory watch before Skip button appears',
    duration_seconds INT NOT NULL DEFAULT 30     COMMENT 'Max ad length; player stops at this point even if stream continues',

    -- Targeting
    show_for_guests TINYINT(1) NOT NULL DEFAULT 1    COMMENT '1 = show to non-logged-in visitors',
    show_for_free_users TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = show to users with no active paid plan',

    -- Frequency & rotation
    max_impressions_per_session INT NOT NULL DEFAULT 3
        COMMENT 'Max times this ad is shown per browser session (0 = unlimited)',
    display_frequency INT NOT NULL DEFAULT 1
        COMMENT 'Show ad every N channel switches (1 = every switch, 3 = every 3rd switch)',
    weight INT NOT NULL DEFAULT 1
        COMMENT 'Relative rotation weight; higher = appears more often among active ads',

    -- Scheduling
    start_date DATE NULL  COMMENT 'Campaign start date (NULL = no lower bound)',
    end_date DATE NULL    COMMENT 'Campaign end date (NULL = no upper bound)',

    -- Status & analytics
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    total_impressions INT NOT NULL DEFAULT 0,
    total_skips INT NOT NULL DEFAULT 0,
    total_clicks INT NOT NULL DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_uuid (uuid),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
