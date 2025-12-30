-- Создание таблицы рецептов для MySQL/MariaDB
CREATE TABLE IF NOT EXISTS recipes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    
    calories INT NOT NULL,
    protein INT NOT NULL,
    fat INT NOT NULL,
    carbs INT NOT NULL,
    fiber INT,
    sugar INT,
    sodium INT,
    
    health_score INT,
    
    time_minutes INT,
    difficulty VARCHAR(50),
    meal_type VARCHAR(50),
    
    ingredients_json TEXT NOT NULL,
    instructions_json TEXT NOT NULL,
    
    created_by_user_id INT,
    is_ai_generated INT DEFAULT 1,
    usage_count INT DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    
    FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_recipes_name (name),
    INDEX idx_recipes_meal_type (meal_type),
    INDEX idx_recipes_created_by (created_by_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Добавление связи с рецептами в meal_photos (если колонка не существует)
SET @dbname = DATABASE();
SET @tablename = 'meal_photos';
SET @columnname = 'recipe_id';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT, ADD INDEX idx_meal_photos_recipe (', @columnname, '), ADD FOREIGN KEY (', @columnname, ') REFERENCES recipes(id) ON DELETE SET NULL')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

