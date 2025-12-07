#!/bin/bash
# Скрипт для инициализации базы данных

echo "Инициализация базы данных caloriesapp..."

# Параметры подключения (из .env или по умолчанию)
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-1435511926Ss..}"
DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-caloriesapp}"

# Создание базы данных
echo "Создание базы данных $DB_NAME..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;
EOF

if [ $? -eq 0 ]; then
    echo "✓ База данных $DB_NAME создана успешно"
else
    echo "✗ Ошибка при создании базы данных"
    exit 1
fi

echo ""
echo "Готово! База данных создана."
echo ""
echo "Следующие шаги:"
echo "1. Запустите приложение: python run.py"
echo "2. Таблицы создадутся автоматически при первом запуске"
echo "3. Проверьте подключение: python scripts/check_db.py"
