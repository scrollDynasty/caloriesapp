#!/usr/bin/env python3
"""
Импорт USDA FoodData CSV в MariaDB
Оптимизированный батчевый импорт для больших датасетов
"""

import csv
import sys
import os
from datetime import datetime
import pymysql
from pymysql import cursors

# Конфигурация БД
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '1435511926Ss..',
    'database': 'caloriesapp',
    'charset': 'utf8mb4',
    'cursorclass': cursors.DictCursor
}

BATCH_SIZE = 5000  # Вставка по 5000 строк за раз
FOODDATA_PATH = '/home/scroll/backend/fooddata'


def parse_date(date_str):
    """Парсинг даты из CSV"""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, '%Y-%m-%d').date()
    except:
        return None


def import_foods(cursor, csv_path):
    """Импорт таблицы foods"""
    print(f"\n📥 Импорт foods из {csv_path}")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        batch = []
        total = 0
        
        for row in reader:
            try:
                fdc_id = int(row['fdc_id'])
                data_type = row['data_type']
                description = row['description']
                food_category_id = row.get('food_category_id') or None
                publication_date = parse_date(row.get('publication_date'))
                
                batch.append((fdc_id, data_type, description, food_category_id, publication_date))
                
                if len(batch) >= BATCH_SIZE:
                    cursor.executemany(
                        """INSERT IGNORE INTO foods 
                           (fdc_id, data_type, description, food_category_id, publication_date)
                           VALUES (%s, %s, %s, %s, %s)""",
                        batch
                    )
                    total += len(batch)
                    print(f"  ✓ Вставлено {total:,} строк", end='\r')
                    batch = []
            except Exception as e:
                print(f"\n⚠️  Ошибка строки {total}: {e}")
                continue
        
        # Вставляем остатки
        if batch:
            cursor.executemany(
                """INSERT IGNORE INTO foods 
                   (fdc_id, data_type, description, food_category_id, publication_date)
                   VALUES (%s, %s, %s, %s, %s)""",
                batch
            )
            total += len(batch)
        
        print(f"\n✅ Foods импортировано: {total:,} строк")
        return total


def import_food_nutrients(cursor, csv_path):
    """Импорт таблицы food_nutrients"""
    print(f"\n📥 Импорт food_nutrients из {csv_path}")
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        batch = []
        total = 0
        
        for row in reader:
            try:
                fdc_id = int(row['fdc_id'])
                nutrient_id = int(row['nutrient_id'])
                amount = float(row['amount']) if row.get('amount') else None
                
                batch.append((fdc_id, nutrient_id, amount))
                
                if len(batch) >= BATCH_SIZE:
                    cursor.executemany(
                        """INSERT IGNORE INTO food_nutrients 
                           (fdc_id, nutrient_id, amount)
                           VALUES (%s, %s, %s)""",
                        batch
                    )
                    total += len(batch)
                    print(f"  ✓ Вставлено {total:,} строк", end='\r')
                    batch = []
            except Exception as e:
                print(f"\n⚠️  Ошибка строки {total}: {e}")
                continue
        
        # Вставляем остатки
        if batch:
            cursor.executemany(
                """INSERT IGNORE INTO food_nutrients 
                   (fdc_id, nutrient_id, amount)
                   VALUES (%s, %s, %s)""",
                batch
            )
            total += len(batch)
        
        print(f"\n✅ Food nutrients импортировано: {total:,} строк")
        return total


def import_branded_foods(cursor, csv_path):
    """Импорт таблицы branded_foods"""
    print(f"\n📥 Импорт branded_foods из {csv_path}")
    
    if not os.path.exists(csv_path):
        print(f"⚠️  Файл не найден: {csv_path}")
        return 0
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        batch = []
        total = 0
        
        for row in reader:
            try:
                fdc_id = int(row['fdc_id'])
                brand_owner = row.get('brand_owner')
                brand_name = row.get('brand_name')
                subbrand_name = row.get('subbrand_name')
                gtin_upc = row.get('gtin_upc')
                ingredients = row.get('ingredients')
                serving_size = float(row['serving_size']) if row.get('serving_size') else None
                serving_size_unit = row.get('serving_size_unit')
                household_serving = row.get('household_serving_fulltext')
                
                batch.append((
                    fdc_id, brand_owner, brand_name, subbrand_name, gtin_upc,
                    ingredients, serving_size, serving_size_unit, household_serving
                ))
                
                if len(batch) >= BATCH_SIZE:
                    cursor.executemany(
                        """INSERT IGNORE INTO branded_foods 
                           (fdc_id, brand_owner, brand_name, subbrand_name, gtin_upc,
                            ingredients, serving_size, serving_size_unit, household_serving_fulltext)
                           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        batch
                    )
                    total += len(batch)
                    print(f"  ✓ Вставлено {total:,} строк", end='\r')
                    batch = []
            except Exception as e:
                print(f"\n⚠️  Ошибка строки {total}: {e}")
                continue
        
        # Вставляем остатки
        if batch:
            cursor.executemany(
                """INSERT IGNORE INTO branded_foods 
                   (fdc_id, brand_owner, brand_name, subbrand_name, gtin_upc,
                    ingredients, serving_size, serving_size_unit, household_serving_fulltext)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                batch
            )
            total += len(batch)
        
        print(f"\n✅ Branded foods импортировано: {total:,} строк")
        return total


def main():
    print("="*60)
    print("USDA FoodData → MariaDB Import")
    print("="*60)
    
    start_time = datetime.now()
    
    try:
        # Подключение к БД
        print("\n🔌 Подключение к MariaDB...")
        connection = pymysql.connect(**DB_CONFIG)
        cursor = connection.cursor()
        print("✅ Подключено")
        
        # Отключаем проверки для скорости
        cursor.execute("SET FOREIGN_KEY_CHECKS=0")
        cursor.execute("SET UNIQUE_CHECKS=0")
        cursor.execute("SET AUTOCOMMIT=0")
        
        # Импорт данных
        foods_count = import_foods(cursor, os.path.join(FOODDATA_PATH, 'food.csv'))
        connection.commit()
        
        nutrients_count = import_food_nutrients(cursor, os.path.join(FOODDATA_PATH, 'food_nutrient.csv'))
        connection.commit()
        
        branded_count = import_branded_foods(cursor, os.path.join(FOODDATA_PATH, 'branded_food.csv'))
        connection.commit()
        
        # Включаем проверки обратно
        cursor.execute("SET FOREIGN_KEY_CHECKS=1")
        cursor.execute("SET UNIQUE_CHECKS=1")
        cursor.execute("SET AUTOCOMMIT=1")
        
        # Статистика
        print("\n" + "="*60)
        print("📊 Статистика импорта:")
        print(f"   Foods: {foods_count:,}")
        print(f"   Nutrients: {nutrients_count:,}")
        print(f"   Branded: {branded_count:,}")
        print(f"   Время: {datetime.now() - start_time}")
        print("="*60)
        
        cursor.close()
        connection.close()
        
        print("\n✅ Импорт завершён успешно!")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
