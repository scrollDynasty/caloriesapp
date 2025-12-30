-- Создание таблицы рецептов
CREATE TABLE IF NOT EXISTS recipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    fat INTEGER NOT NULL,
    carbs INTEGER NOT NULL,
    fiber INTEGER,
    sugar INTEGER,
    sodium INTEGER,
    
    health_score INTEGER,
    
    time_minutes INTEGER,
    difficulty VARCHAR(50),
    meal_type VARCHAR(50),
    
    ingredients_json TEXT NOT NULL,
    instructions_json TEXT NOT NULL,
    
    created_by_user_id INTEGER,
    is_ai_generated INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    
    FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON recipes(created_by_user_id);

-- Добавление связи с рецептами в meal_photos
ALTER TABLE meal_photos ADD COLUMN recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_meal_photos_recipe ON meal_photos(recipe_id);

