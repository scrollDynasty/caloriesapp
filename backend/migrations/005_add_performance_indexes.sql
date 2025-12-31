-- Миграция для добавления индексов производительности
-- Запустите: mysql -u root -p caloriesapp < migrations/005_add_performance_indexes.sql

-- Индекс для быстрого получения daily meals (user_id + created_at)
CREATE INDEX IF NOT EXISTS ix_meal_photos_user_date ON meal_photos (user_id, created_at);

-- Индекс для поиска по barcode с user_id
CREATE INDEX IF NOT EXISTS ix_meal_photos_user_barcode ON meal_photos (user_id, barcode);

-- Индекс для daily water logs
CREATE INDEX IF NOT EXISTS ix_water_logs_user_date ON water_logs (user_id, created_at);

-- Индекс для onboarding data по user_id (если нет)
CREATE INDEX IF NOT EXISTS ix_onboarding_data_user ON onboarding_data (user_id);

-- Оптимизация таблиц
ANALYZE TABLE meal_photos;
ANALYZE TABLE water_logs;
ANALYZE TABLE users;
ANALYZE TABLE onboarding_data;

