-- Миграция: создание таблиц для USDA Food Database
-- Дата: 2026-01-04

-- Таблица продуктов (2M+ строк)
CREATE TABLE IF NOT EXISTS foods (
    fdc_id INT PRIMARY KEY,
    data_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    food_category_id VARCHAR(100),
    publication_date DATE,
    INDEX idx_data_type (data_type),
    FULLTEXT INDEX idx_description (description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица нутриентов (20M+ строк)
CREATE TABLE IF NOT EXISTS food_nutrients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    fdc_id INT NOT NULL,
    nutrient_id INT NOT NULL,
    amount DECIMAL(12, 4),
    INDEX idx_fdc_id (fdc_id),
    INDEX idx_nutrient_id (nutrient_id),
    INDEX idx_fdc_nutrient (fdc_id, nutrient_id),
    FOREIGN KEY (fdc_id) REFERENCES foods(fdc_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Таблица брендированных продуктов
CREATE TABLE IF NOT EXISTS branded_foods (
    fdc_id INT PRIMARY KEY,
    brand_owner VARCHAR(255),
    brand_name VARCHAR(255),
    subbrand_name VARCHAR(255),
    gtin_upc VARCHAR(50),
    ingredients TEXT,
    serving_size DECIMAL(10, 2),
    serving_size_unit VARCHAR(50),
    household_serving_fulltext VARCHAR(255),
    INDEX idx_brand_owner (brand_owner),
    INDEX idx_gtin_upc (gtin_upc),
    FOREIGN KEY (fdc_id) REFERENCES foods(fdc_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Вспомогательная таблица: маппинг nutrient_id на названия
-- Основные нутриенты USDA:
-- 1008 = Energy (kcal)
-- 1003 = Protein
-- 1004 = Total lipid (fat)
-- 1005 = Carbohydrate
-- 1079 = Fiber
-- 1087 = Calcium
-- 1089 = Iron
CREATE TABLE IF NOT EXISTS nutrient_names (
    nutrient_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit_name VARCHAR(20),
    UNIQUE INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Вставляем основные нутриенты
INSERT IGNORE INTO nutrient_names (nutrient_id, name, unit_name) VALUES
(1008, 'Energy', 'kcal'),
(1003, 'Protein', 'g'),
(1004, 'Total lipid (fat)', 'g'),
(1005, 'Carbohydrate, by difference', 'g'),
(1079, 'Fiber, total dietary', 'g'),
(1087, 'Calcium, Ca', 'mg'),
(1089, 'Iron, Fe', 'mg'),
(1090, 'Magnesium, Mg', 'mg'),
(1092, 'Potassium, K', 'mg'),
(1093, 'Sodium, Na', 'mg'),
(1095, 'Zinc, Zn', 'mg'),
(1106, 'Vitamin A, RAE', 'µg'),
(1162, 'Vitamin C, total ascorbic acid', 'mg'),
(1175, 'Vitamin B-6', 'mg'),
(1178, 'Vitamin B-12', 'µg'),
(1109, 'Vitamin E (alpha-tocopherol)', 'mg'),
(1114, 'Vitamin D (D2 + D3)', 'µg');
