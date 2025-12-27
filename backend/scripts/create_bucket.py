"""
Скрипт для создания бакета в Yandex Object Storage
Запустите этот скрипт один раз для настройки хранилища
"""
import sys
import os

# Добавляем путь к приложению
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from app.core.config import settings


def create_bucket():
    """Создать бакет в Yandex Object Storage"""
    
    print("=" * 60)
    print("🪣 Создание бакета в Yandex Object Storage")
    print("=" * 60)
    
    # Инициализация клиента
    print(f"\n📡 Подключение к {settings.yandex_storage_endpoint}...")
    session = boto3.session.Session()
    s3_client = session.client(
        service_name='s3',
        endpoint_url=settings.yandex_storage_endpoint,
        aws_access_key_id=settings.yandex_storage_access_key,
        aws_secret_access_key=settings.yandex_storage_secret_key,
        region_name=settings.yandex_storage_region,
        config=Config(signature_version='s3v4')
    )
    
    bucket_name = settings.yandex_storage_bucket_name
    
    # Проверяем существование бакета
    print(f"🔍 Проверка бакета '{bucket_name}'...")
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        print(f"✅ Бакет '{bucket_name}' уже существует!")
        return True
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', '')
        if error_code != '404':
            print(f"❌ Ошибка при проверке бакета: {e}")
            return False
    
    # Создаём бакет
    print(f"\n🚀 Создание бакета '{bucket_name}'...")
    try:
        s3_client.create_bucket(Bucket=bucket_name)
        print(f"✅ Бакет '{bucket_name}' создан успешно!")
    except ClientError as e:
        print(f"❌ Ошибка при создании бакета: {e}")
        print("\n💡 Пожалуйста, создайте бакет вручную:")
        print(f"   1. Откройте https://console.cloud.yandex.ru/")
        print(f"   2. Перейдите в Object Storage")
        print(f"   3. Нажмите 'Создать бакет'")
        print(f"   4. Укажите имя: {bucket_name}")
        print(f"   5. Включите публичный доступ для чтения объектов")
        return False
    
    # Настраиваем публичный доступ
    print(f"\n🔓 Настройка публичного доступа...")
    try:
        # Пытаемся установить ACL
        s3_client.put_bucket_acl(
            Bucket=bucket_name,
            ACL='public-read'
        )
        print(f"✅ Публичный доступ настроен!")
    except ClientError as acl_error:
        print(f"⚠️  Не удалось автоматически настроить публичный доступ: {acl_error}")
        print("\n💡 Настройте вручную в консоли Yandex Cloud:")
        print(f"   1. Откройте бакет '{bucket_name}'")
        print(f"   2. Перейдите в настройки")
        print(f"   3. Включите 'Публичный доступ на чтение объектов'")
    
    # Настраиваем CORS
    print(f"\n🌐 Настройка CORS...")
    try:
        cors_configuration = {
            'CORSRules': [{
                'AllowedHeaders': ['*'],
                'AllowedMethods': ['GET', 'HEAD'],
                'AllowedOrigins': ['*'],
                'MaxAgeSeconds': 3000
            }]
        }
        s3_client.put_bucket_cors(
            Bucket=bucket_name,
            CORSConfiguration=cors_configuration
        )
        print(f"✅ CORS настроен!")
    except ClientError as cors_error:
        print(f"⚠️  Не удалось автоматически настроить CORS: {cors_error}")
        print("\n💡 Настройте вручную в консоли Yandex Cloud:")
        print(f"   1. Откройте бакет '{bucket_name}'")
        print(f"   2. Перейдите в раздел CORS")
        print(f"   3. Добавьте правило с разрешением GET и HEAD для всех источников")
    
    print("\n" + "=" * 60)
    print("✅ Настройка завершена!")
    print("=" * 60)
    print(f"\n📦 Бакет: {bucket_name}")
    print(f"🌍 Endpoint: {settings.yandex_storage_endpoint}")
    print(f"🔗 URL: {settings.yandex_storage_endpoint}/{bucket_name}/")
    print("\n🎉 Теперь вы можете использовать Yandex Object Storage!")
    
    return True


if __name__ == "__main__":
    try:
        success = create_bucket()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Неожиданная ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
