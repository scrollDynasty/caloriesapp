# 🚀 Руководство по масштабированию приложения

Это руководство поможет вам настроить приложение для работы с 10,000+ пользователями используя Docker, Kubernetes и Redis.

## 📦 Что было добавлено

### 1. Docker
- ✅ `Dockerfile` - образ для бэкенда
- ✅ `.dockerignore` - исключения для сборки
- ✅ `docker-compose.yml` - локальная разработка с Redis и MySQL

### 2. Redis интеграция
- ✅ `app/services/cache.py` - сервис для работы с кэшем
- ✅ Добавлен в `requirements.txt`
- ✅ Настроен в `config.py`

### 3. Kubernetes
- ✅ Все манифесты в директории `k8s/`
- ✅ Автомасштабирование (HPA)
- ✅ Health checks
- ✅ Persistent volumes для Redis

### 4. Скрипты
- ✅ `k8s/deploy.sh` - автоматический деплой
- ✅ `scripts/build-and-push.sh` - сборка и загрузка образа

## 🎯 Пошаговая инструкция

### Шаг 1: Локальное тестирование с Docker Compose

```bash
cd backend

# Создайте .env файл (скопируйте из env.prod.sample)
cp env.prod.sample .env
# Отредактируйте .env с вашими настройками

# Запустите все сервисы
docker-compose up -d

# Проверьте логи
docker-compose logs -f backend

# Проверьте работу
curl http://localhost:8000/health
```

### Шаг 2: Сборка Docker образа

```bash
cd backend

# Сделайте скрипт исполняемым
chmod +x scripts/build-and-push.sh

# Соберите и загрузите образ
export DOCKER_REGISTRY="your-registry"  # Замените на ваш
./scripts/build-and-push.sh v1.0.0
```

### Шаг 3: Подготовка Kubernetes

```bash
cd k8s

# Создайте secrets
kubectl create secret generic app-secrets \
  --from-env-file=../backend/.env \
  -n caloriesapp

# Или создайте secrets.yaml из примера
cp secrets.yaml.example secrets.yaml
# Отредактируйте secrets.yaml с реальными значениями
kubectl apply -f secrets.yaml
```

### Шаг 4: Деплой в Kubernetes

```bash
cd k8s

# Обновите deployment.yaml с вашим registry
sed -i 's|your-registry|your-actual-registry|g' backend/deployment.yaml

# Запустите деплой
chmod +x deploy.sh
./deploy.sh production
```

### Шаг 5: Проверка

```bash
# Проверьте статус
kubectl get all -n caloriesapp

# Проверьте логи
kubectl logs -f deployment/backend-api -n caloriesapp

# Проверьте HPA
kubectl get hpa -n caloriesapp
```

## 🔧 Использование Redis кэша в коде

### Пример 1: Кэширование данных пользователя

```python
from app.services.cache import CacheService

@router.get("/meals/daily")
async def get_daily_meals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cache_key = f"daily_meals:{current_user.id}:{today_str}"
    
    # Попытка получить из кэша
    cached = CacheService.get(cache_key)
    if cached:
        return cached
    
    # Запрос к БД
    meals = db.query(MealPhoto).filter(...).all()
    result = serialize_meals(meals)
    
    # Сохранение в кэш на 1 час
    CacheService.set(cache_key, result, expire=3600)
    return result
```

### Пример 2: Инвалидация кэша при изменениях

```python
from app.services.cache import CacheService, invalidate_cache_pattern

@router.post("/meals/upload")
async def upload_meal(...):
    # Создание записи
    meal = create_meal(...)
    
    # Инвалидация кэша пользователя
    CacheService.delete_pattern(f"daily_meals:{current_user.id}:*")
    
    return meal
```

### Пример 3: Декоратор для автоматического кэширования

```python
from app.services.cache import cache_result

@cache_result(expire=1800, key_prefix="user_stats")
@router.get("/stats")
async def get_user_stats(user_id: int):
    # Функция автоматически кэшируется
    return calculate_stats(user_id)
```

## 📊 Мониторинг и оптимизация

### Проверка использования ресурсов

```bash
# Использование CPU и памяти
kubectl top pods -n caloriesapp

# Детальная информация о поде
kubectl describe pod <pod-name> -n caloriesapp
```

### Масштабирование

HPA автоматически масштабирует поды, но вы можете вручную:

```bash
# Увеличить количество реплик
kubectl scale deployment backend-api --replicas=5 -n caloriesapp

# Проверить статус масштабирования
kubectl get hpa backend-hpa -n caloriesapp
```

### Оптимизация БД

1. **Connection Pooling** - уже настроен в `database.py`
2. **Индексы** - проверьте наличие индексов в БД
3. **Read Replicas** - для чтения используйте отдельные реплики

## 🔐 Безопасность

### Важные моменты:

1. **Secrets:**
   - Никогда не коммитьте `.env` или `secrets.yaml` с реальными значениями
   - Используйте Kubernetes Secrets
   - Рассмотрите использование Vault для production

2. **Образы:**
   - Используйте приватный registry
   - Сканируйте образы на уязвимости
   - Используйте конкретные теги, не `latest` в production

3. **Сеть:**
   - Настройте Network Policies
   - Используйте TLS везде
   - Ограничьте доступ к admin панели

## 📈 Рекомендации для 10,000 пользователей

### Ресурсы:

- **Backend pods:** 3-5 (автомасштабирование до 10)
- **Redis:** 1 pod (2GB памяти)
- **MySQL:** Управляемая БД или 2 реплики
- **Worker nodes:** 3-5 nodes (4 CPU, 8GB RAM каждый)

### Оптимизации:

1. **Кэширование:**
   - Кэшируйте данные пользователей на 5-15 минут
   - Кэшируйте статистику на 1 час
   - Используйте Redis для сессий

2. **База данных:**
   - Используйте connection pooling (20-30 connections)
   - Настройте read replicas
   - Оптимизируйте медленные запросы

3. **API:**
   - Используйте rate limiting (уже настроено)
   - Оптимизируйте N+1 запросы
   - Используйте пагинацию везде

## 🆘 Troubleshooting

### Проблема: Поды не запускаются

```bash
# Проверьте логи
kubectl logs <pod-name> -n caloriesapp

# Проверьте события
kubectl get events -n caloriesapp --sort-by='.lastTimestamp'

# Проверьте описание
kubectl describe pod <pod-name> -n caloriesapp
```

### Проблема: Redis недоступен

```bash
# Проверьте статус Redis
kubectl get pods -l app=redis -n caloriesapp

# Проверьте логи Redis
kubectl logs deployment/redis -n caloriesapp

# Проверьте подключение
kubectl exec -it deployment/redis -n caloriesapp -- redis-cli ping
```

### Проблема: Высокая нагрузка на БД

1. Проверьте connection pool settings
2. Увеличьте кэширование
3. Оптимизируйте запросы
4. Рассмотрите read replicas

## 📞 Следующие шаги

1. ✅ Настройте мониторинг (Prometheus + Grafana)
2. ✅ Настройте логирование (Loki + Grafana)
3. ✅ Настройте алерты
4. ✅ Настройте автоматические бэкапы БД
5. ✅ Настройте CI/CD pipeline

## 📚 Полезные команды

```bash
# Перезапуск deployment
kubectl rollout restart deployment/backend-api -n caloriesapp

# Откат к предыдущей версии
kubectl rollout undo deployment/backend-api -n caloriesapp

# Просмотр истории деплоев
kubectl rollout history deployment/backend-api -n caloriesapp

# Порт-форвардинг для локального доступа
kubectl port-forward svc/backend-service 8000:80 -n caloriesapp

# Подключение к Redis
kubectl port-forward svc/redis-service 6379:6379 -n caloriesapp
```

