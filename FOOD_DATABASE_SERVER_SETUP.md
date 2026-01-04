# Food Database - Настройка на Production сервере

## Проблема
Network Error при запросах к `/api/v1/foods/*` - backend либо не запущен, либо не имеет нужных зависимостей.

## Решение на сервере api.yeb-ich.com

### 1. Установите boto3
```bash
cd /path/to/backend
pip install boto3==1.35.83
```

### 2. Добавьте переменные в .env
```bash
# Yandex Object Storage credentials
YANDEX_STORAGE_ACCESS_KEY=ваш_access_key
YANDEX_STORAGE_SECRET_KEY=ваш_secret_key
YANDEX_STORAGE_BUCKET_NAME=caloriesapp
YANDEX_STORAGE_ENDPOINT=https://storage.yandexcloud.net
YANDEX_STORAGE_REGION=ru-central1
```

### 3. Загрузите CSV файлы в Yandex Storage

Используйте скрипт из проекта:
```bash
cd /path/to/backend
python scripts/upload_to_s3.py
```

Или вручную через Yandex Console:
1. Зайдите в https://console.cloud.yandex.ru/folders/YOUR_FOLDER_ID/storage/buckets/caloriesapp
2. Создайте папку `fooddata/`
3. Загрузите все CSV файлы из локальной папки `FoodData/`:
   - food.csv
   - food_nutrient.csv
   - nutrient.csv
   - foundation_food.csv
   - branded_food.csv
   - survey_fndds_food.csv
   - food_portion.csv
   - food_category.csv
   - measure_unit.csv

### 4. Перезапустите backend
```bash
# Если используется systemd
sudo systemctl restart caloriesapp

# Или если запущен через screen/tmux
pkill -f uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 5. Проверьте nginx
```bash
# Проверьте конфигурацию
sudo nginx -t

# Если нужно, перезагрузите nginx
sudo systemctl reload nginx
```

### 6. Тест endpoints
```bash
# Проверьте доступность (требуется токен авторизации)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.yeb-ich.com/api/v1/foods?limit=5&source=foundation

curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.yeb-ich.com/api/v1/foods/search?q=milk&limit=10&source=all
```

## Временное решение

В компоненте добавлены mock данные, которые показываются если сервер недоступен.
Это позволяет тестировать UI без работающего backend.

## Проверка файлов на сервере

Убедитесь что на сервере есть все нужные файлы:
```bash
ls -la /path/to/backend/app/api/v1/foods.py
ls -la /path/to/backend/app/services/food_database.py
```

И что они подключены в main.py:
```python
from app.api.v1 import foods
app.include_router(foods.router, prefix="/api/v1", tags=["foods"])
```
