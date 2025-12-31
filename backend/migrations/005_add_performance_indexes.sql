CREATE INDEX IF NOT EXISTS ix_meal_photos_user_date ON meal_photos (user_id, created_at);
CREATE INDEX IF NOT EXISTS ix_meal_photos_user_barcode ON meal_photos (user_id, barcode);
CREATE INDEX IF NOT EXISTS ix_water_logs_user_date ON water_logs (user_id, created_at);
CREATE INDEX IF NOT EXISTS ix_onboarding_data_user ON onboarding_data (user_id);

ANALYZE TABLE meal_photos;
ANALYZE TABLE water_logs;
ANALYZE TABLE users;
ANALYZE TABLE onboarding_data;
