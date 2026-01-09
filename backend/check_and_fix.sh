#!/bin/bash

echo "=== Проверка и исправление backend ==="

# 1. Проверка установки anthropic
echo ""
echo "1. Проверка библиотеки anthropic..."
if python -c "import anthropic" 2>/dev/null; then
    echo "✓ anthropic установлена"
    python -c "import anthropic; print(f'  Версия: {anthropic.__version__}')"
else
    echo "✗ anthropic НЕ установлена"
    echo "  Устанавливаю..."
    pip install anthropic==0.40.0
    if [ $? -eq 0 ]; then
        echo "✓ anthropic успешно установлена"
    else
        echo "✗ Ошибка установки anthropic"
        exit 1
    fi
fi

echo ""
echo "2. Проверка настроек .env..."
if grep -q "^ANTHROPIC_API_KEY=" .env; then
    echo "✓ ANTHROPIC_API_KEY найден"
    sed -i 's/^ANTHROPIC_API_KEY=\(.*\) $/ANTHROPIC_API_KEY=\1/' .env
else
    echo "✗ ANTHROPIC_API_KEY не найден в .env"
    exit 1
fi

if grep -q "^ANTHROPIC_MODEL=" .env; then
    echo "✓ ANTHROPIC_MODEL найден"
else
    echo "⚠ ANTHROPIC_MODEL не найден, добавляю..."
    echo "ANTHROPIC_MODEL=claude-3-5-sonnet-20241022" >> .env
fi

echo ""
echo "3. Проверка импорта в Python..."
python << 'EOF'
import sys
try:
    from anthropic import AsyncAnthropic
    print("✓ AsyncAnthropic успешно импортирован")
    
    from app.core.config import settings
    if settings.anthropic_api_key:
        print("✓ API ключ загружен из настроек")
        print(f"  Длина ключа: {len(settings.anthropic_api_key)} символов")
        print(f"  Модель: {settings.anthropic_model}")
    else:
        print("✗ API ключ пустой в настройках")
        sys.exit(1)
        
    from app.services.ai_service import ai_service
    if ai_service.is_configured:
        print("✓ AI сервис сконфигурирован")
    else:
        print("✗ AI сервис не сконфигурирован")
        sys.exit(1)
        
except ImportError as e:
    print(f"✗ Ошибка импорта: {e}")
    sys.exit(1)
except Exception as e:
    print(f"✗ Ошибка: {e}")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Проверка завершилась с ошибками"
    exit 1
fi

# 4. Перезапуск backend
echo ""
echo "4. Перезапуск backend..."
pm2 restart caloriesapp-backend

echo ""
echo "5. Ожидание запуска..."
sleep 3

echo ""
echo "6. Проверка логов..."
pm2 logs caloriesapp-backend --lines 20 --nostream

echo ""
echo "=== ✅ Проверка завершена ==="
echo ""
echo "Теперь попробуйте загрузить фото еды в приложении."
echo "Для просмотра логов в реальном времени: pm2 logs caloriesapp-backend"
