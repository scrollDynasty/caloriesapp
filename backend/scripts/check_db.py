#!/usr/bin/env python3
"""
Скрипт для проверки подключения к базе данных
"""
import sys
import os

# Добавляем корневую директорию в путь
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.core.config import settings
    from app.core.database import engine
    
    print("Проверка подключения к базе данных...")
    print(f"Host: {settings.db_host}")
    print(f"Port: {settings.db_port}")
    print(f"Database: {settings.db_name}")
    print(f"User: {settings.db_user}")
    
    # Пробуем подключиться
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("✓ Подключение к базе данных успешно!")
        
        # Проверяем существование базы данных
        result = conn.execute(text("SELECT DATABASE()"))
        db_name = result.scalar()
        if db_name:
            print(f"✓ Используется база данных: {db_name}")
        else:
            print("⚠ База данных не выбрана")
            
        # Проверяем существование таблиц
        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]
        if tables:
            print(f"✓ Найдено таблиц: {len(tables)}")
            for table in tables:
                print(f"  - {table}")
        else:
            print("⚠ Таблицы не найдены. Запустите приложение для их создания.")
            
except Exception as e:
    print(f"✗ Ошибка подключения: {e}")
    print("\nУбедитесь, что:")
    print("1. MariaDB/MySQL запущен")
    print("2. База данных создана")
    print("3. Параметры в .env файле правильные")
    sys.exit(1)
