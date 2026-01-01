-- Migration: Add user_badges table for badge tracking
-- Date: 2026-01-01

CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id VARCHAR(50) NOT NULL,
    category VARCHAR(20) NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    seen BOOLEAN DEFAULT FALSE,
    notified BOOLEAN DEFAULT FALSE,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id),
    INDEX idx_user_badges_user (user_id),
    INDEX idx_user_badges_badge (badge_id),
    INDEX idx_user_badges_seen (user_id, seen)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Award existing badges based on current user stats
-- This will be handled by the application on first badge check

