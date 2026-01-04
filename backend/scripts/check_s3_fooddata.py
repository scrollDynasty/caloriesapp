#!/usr/bin/env python3
"""
Скрипт для проверки CSV структуры и подключения к Yandex Storage
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Загружаем .env
load_dotenv()

# Настройки Yandex Storage
ACCESS_KEY = os.getenv("YANDEX_STORAGE_ACCESS_KEY")
SECRET_KEY = os.getenv("YANDEX_STORAGE_SECRET_KEY")
BUCKET_NAME = os.getenv("YANDEX_STORAGE_BUCKET_NAME", "caloriesapp")
ENDPOINT = os.getenv("YANDEX_STORAGE_ENDPOINT", "https://storage.yandexcloud.net")
REGION = os.getenv("YANDEX_STORAGE_REGION", "ru-central1")

def check_s3_connection():
    """Проверяет подключение к Yandex Storage"""
    print("=" * 50)
    print("Проверка подключения к Yandex Storage")
    print("=" * 50)
    
    if not ACCESS_KEY or not SECRET_KEY:
        print("❌ ОШИБКА: Не заданы YANDEX_STORAGE_ACCESS_KEY или YANDEX_STORAGE_SECRET_KEY")
        return None
    
    print(f"Bucket: {BUCKET_NAME}")
    print(f"Endpoint: {ENDPOINT}")
    print(f"Region: {REGION}")
    
    try:
        s3 = boto3.client(
            's3',
            endpoint_url=ENDPOINT,
            region_name=REGION,
            aws_access_key_id=ACCESS_KEY,
            aws_secret_access_key=SECRET_KEY
        )
        print("✅ Клиент S3 создан успешно")
        return s3
    except Exception as e:
        print(f"❌ Ошибка создания клиента: {e}")
        return None

def list_bucket_contents(s3):
    """Показывает содержимое bucket'а"""
    print("\n" + "=" * 50)
    print(f"Содержимое bucket '{BUCKET_NAME}'")
    print("=" * 50)
    
    try:
        response = s3.list_objects_v2(Bucket=BUCKET_NAME)
        
        if 'Contents' not in response:
            print("❌ Bucket пуст или не существует")
            return
        
        print(f"Найдено {len(response['Contents'])} файлов:\n")
        
        for obj in response['Contents']:
            size_kb = obj['Size'] / 1024
            if size_kb > 1024:
                size_str = f"{size_kb/1024:.2f} MB"
            else:
                size_str = f"{size_kb:.2f} KB"
            print(f"  📄 {obj['Key']} ({size_str})")
            
    except ClientError as e:
        print(f"❌ Ошибка доступа к bucket: {e}")

def check_csv_structure(s3, file_path: str):
    """Проверяет структуру CSV файла"""
    print(f"\n📋 Проверка структуры: {file_path}")
    
    try:
        response = s3.get_object(Bucket=BUCKET_NAME, Key=file_path)
        # Читаем только первые 10KB для анализа заголовков
        content = response['Body'].read(10240).decode('utf-8')
        
        lines = content.split('\n')
        if lines:
            headers = lines[0].strip()
            print(f"   Заголовки: {headers}")
            
            if len(lines) > 1:
                first_row = lines[1].strip()
                print(f"   Пример строки: {first_row[:100]}...")
        
        return True
    except ClientError as e:
        print(f"   ❌ Файл не найден: {e}")
        return False

def main():
    s3 = check_s3_connection()
    
    if not s3:
        print("\n⚠️ Не удалось подключиться к Yandex Storage")
        return
    
    list_bucket_contents(s3)
    
    # Проверяем ожидаемые файлы
    expected_files = [
        "fooddata/food.csv",
        "fooddata/food_nutrient.csv", 
        "fooddata/foundation_food.csv"
    ]
    
    print("\n" + "=" * 50)
    print("Проверка структуры CSV файлов")
    print("=" * 50)
    
    for file_path in expected_files:
        check_csv_structure(s3, file_path)
    
    print("\n" + "=" * 50)
    print("Проверка завершена!")
    print("=" * 50)

if __name__ == "__main__":
    main()
