CREATE INDEX IF NOT EXISTS idx_meal_photos_user_created 
ON meal_photos(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_water_logs_user_created 
ON water_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_created 
ON weight_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_photos_user_created 
ON progress_photos(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_username 
ON users(username);
