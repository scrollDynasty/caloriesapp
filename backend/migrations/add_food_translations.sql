-- Миграция: добавление колонок для мультиязычности продуктов
-- Дата: 2026-01-04

-- Добавляем колонки для переводов (description уже есть на английском)
ALTER TABLE foods 
ADD COLUMN description_en TEXT GENERATED ALWAYS AS (description) VIRTUAL,
ADD COLUMN description_ru TEXT DEFAULT NULL,
ADD COLUMN description_uz TEXT DEFAULT NULL;

-- Индексы для полнотекстового поиска на разных языках
CREATE FULLTEXT INDEX idx_description_ru ON foods(description_ru);
CREATE FULLTEXT INDEX idx_description_uz ON foods(description_uz);

-- Таблица для отслеживания прогресса перевода
CREATE TABLE IF NOT EXISTS translation_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    language VARCHAR(5) NOT NULL,
    last_fdc_id INT DEFAULT 0,
    total_translated INT DEFAULT 0,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE INDEX idx_language (language)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Инициализация прогресса
INSERT IGNORE INTO translation_progress (language, last_fdc_id, total_translated) VALUES
('ru', 0, 0),
('uz', 0, 0);
