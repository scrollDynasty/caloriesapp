# Kubernetes Deployment Guide

Руководство по развёртыванию приложения CaloriesApp в Kubernetes для масштабирования до 10,000 пользователей.

## 📋 Предварительные требования

1. **Kubernetes кластер** (минимум 3 worker nodes)
2. **kubectl** настроен и подключён к кластеру
3. **Docker Registry** для хранения образов
4. **Ingress Controller** (nginx-ingress или traefik)
5. **Storage Class** для Persistent Volumes

## 🚀 Быстрый старт

### 1. Подготовка Docker образа

```bash
cd backend
docker build -t your-registry/caloriesapp-backend:latest .
docker push your-registry/caloriesapp-backend:latest
```

### 2. Создание Secrets

**ВАЖНО:** Никогда не коммитьте реальные secrets в git!

```bash
# Создайте файл secrets.env с вашими секретами
cat > secrets.env << EOF
DB_HOST=mysql-service
DB_USER=root
DB_PASSWORD=your-secure-password
JWT_SECRET_KEY=your-very-secure-jwt-secret-key-minimum-64-characters
OPENAI_API_KEY=sk-proj-your-key
YANDEX_STORAGE_ACCESS_KEY=your-key
YANDEX_STORAGE_SECRET_KEY=your-secret
ADMIN_PASSWORD=your-secure-admin-password
EOF

# Создайте secret в Kubernetes
kubectl create secret generic app-secrets \
  --from-env-file=secrets.env \
  -n caloriesapp
```

### 3. Обновление конфигурации

Отредактируйте `backend/deployment.yaml`:
- Замените `your-registry/caloriesapp-backend:latest` на ваш registry
- Проверьте все переменные окружения

### 4. Деплой

```bash
# Сделайте скрипт исполняемым
chmod +x deploy.sh

# Запустите деплой
./deploy.sh production
```

## 📁 Структура файлов

```
k8s/
├── namespace.yaml          # Namespace для приложения
├── configmap.yaml          # Конфигурация (несекретные данные)
├── secrets.yaml.example    # Пример secrets (НЕ коммитьте реальные!)
├── ingress.yaml            # Ingress для внешнего доступа
├── redis/
│   ├── deployment.yaml    # Redis deployment
│   ├── service.yaml       # Redis service
│   └── pvc.yaml           # Persistent Volume для Redis
├── backend/
│   ├── deployment.yaml    # Backend API deployment
│   ├── service.yaml       # Backend service
│   └── hpa.yaml           # Horizontal Pod Autoscaler
└── deploy.sh              # Скрипт автоматического деплоя
```

## 🔧 Настройка

### Масштабирование

Автоматическое масштабирование настроено через HPA:
- **Минимум подов:** 3
- **Максимум подов:** 10
- **Масштабирование по:** CPU (70%) и Memory (80%)

Для ручного изменения количества реплик:
```bash
kubectl scale deployment backend-api --replicas=5 -n caloriesapp
```

### Ресурсы

Текущие настройки ресурсов на под:
- **Requests:** 512Mi RAM, 500m CPU
- **Limits:** 1Gi RAM, 1000m CPU

Для 10,000 пользователей рекомендуется:
- **3-5 подов** для начала
- **Мониторинг метрик** и масштабирование по необходимости

### База данных

Для production рекомендуется использовать **управляемую БД** (Yandex Managed MySQL):
- Автоматические бэкапы
- Высокая доступность
- Масштабирование

Или разверните MySQL в Kubernetes (см. `mysql/` директорию).

## 📊 Мониторинг

### Проверка статуса

```bash
# Статус подов
kubectl get pods -n caloriesapp

# Логи подов
kubectl logs -f deployment/backend-api -n caloriesapp

# Статус HPA
kubectl get hpa -n caloriesapp

# Использование ресурсов
kubectl top pods -n caloriesapp
```

### Health checks

Приложение имеет health check endpoint:
- `GET /health` - проверка работоспособности

## 🔄 Обновление приложения

```bash
# 1. Соберите новый образ
docker build -t your-registry/caloriesapp-backend:v1.1.0 .
docker push your-registry/caloriesapp-backend:v1.1.0

# 2. Обновите deployment
kubectl set image deployment/backend-api \
  backend=your-registry/caloriesapp-backend:v1.1.0 \
  -n caloriesapp

# 3. Проверьте статус обновления
kubectl rollout status deployment/backend-api -n caloriesapp
```

## 🛠️ Troubleshooting

### Поды не запускаются

```bash
# Проверьте события
kubectl get events -n caloriesapp --sort-by='.lastTimestamp'

# Проверьте логи
kubectl logs <pod-name> -n caloriesapp

# Проверьте описание пода
kubectl describe pod <pod-name> -n caloriesapp
```

### Проблемы с Redis

```bash
# Проверьте статус Redis
kubectl get pods -l app=redis -n caloriesapp

# Подключитесь к Redis
kubectl exec -it deployment/redis -n caloriesapp -- redis-cli
```

### Проблемы с подключением к БД

Убедитесь, что:
1. MySQL доступен из кластера
2. Secrets содержат правильные credentials
3. Network policies не блокируют соединение

## 📈 Оптимизация для 10,000 пользователей

1. **Connection Pooling:**
   - Увеличьте pool_size в database.py до 20-30
   - Настройте max_overflow

2. **Кэширование:**
   - Используйте Redis для кэширования частых запросов
   - Кэшируйте данные пользователей на 5-15 минут

3. **База данных:**
   - Используйте read replicas для чтения
   - Настройте индексы в БД
   - Регулярно оптимизируйте запросы

4. **Мониторинг:**
   - Установите Prometheus + Grafana
   - Настройте алерты на высокую нагрузку

## 🔐 Безопасность

1. **Secrets:**
   - Никогда не коммитьте secrets в git
   - Используйте Kubernetes Secrets или внешние системы (Vault)

2. **Network Policies:**
   - Ограничьте сетевой доступ между подами
   - Используйте Service Mesh при необходимости

3. **RBAC:**
   - Настройте правильные права доступа
   - Используйте минимальные привилегии

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи: `kubectl logs -n caloriesapp`
2. Проверьте события: `kubectl get events -n caloriesapp`
3. Проверьте статус ресурсов: `kubectl get all -n caloriesapp`

