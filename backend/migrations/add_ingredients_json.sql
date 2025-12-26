SET @dbname = DATABASE();
SET @tablename = "meal_photos";
SET @columnname = "ingredients_json";
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname
  ) > 0,
  "SELECT 1",
  CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " TEXT NULL")
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

CREATE INDEX IF NOT EXISTS idx_meal_photos_created_at ON meal_photos(created_at);
CREATE INDEX IF NOT EXISTS idx_meal_photos_health_score ON meal_photos(health_score);
