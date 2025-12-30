#!/bin/bash

set -e

ENV_TYPE="${1:-dev}"

if [ "$ENV_TYPE" != "dev" ] && [ "$ENV_TYPE" != "prod" ]; then
    echo "❌ Ошибка: Неверное окружение. Используйте 'dev' или 'prod'"
    echo "Использование: $0 [dev|prod]"
    exit 1
fi

cd "$(dirname "$0")"

APP_FILE="app.json"
APP_REAL="app.$ENV_TYPE.json"

if [ ! -f "$APP_REAL" ]; then
    echo "❌ Ошибка: Файл $APP_REAL не найден!"
    exit 1
fi

echo "📝 Переключение React Native на $ENV_TYPE окружение..."
cp "$APP_REAL" "$APP_FILE"

echo "✅ Переключено на $ENV_TYPE окружение"
echo "📋 API URL: $(grep -o '"apiUrl": "[^"]*"' "$APP_FILE" | cut -d'"' -f4 || echo 'не найден')"
echo ""
echo "⚠️  ВАЖНО: После переключения перезапустите Expo:"
echo "   npm start -- --clear"

