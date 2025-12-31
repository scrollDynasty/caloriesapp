#!/bin/bash

# Скрипт для деплоя приложения в Kubernetes
# Использование: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
NAMESPACE="caloriesapp"
REGISTRY=${DOCKER_REGISTRY:-"your-registry"}  # Замените на ваш registry
IMAGE_TAG=${IMAGE_TAG:-"latest"}

echo "🚀 Начинаем деплой в окружение: $ENVIRONMENT"
echo "📦 Registry: $REGISTRY"
echo "🏷️  Image tag: $IMAGE_TAG"

# Проверка наличия kubectl
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl не найден. Установите kubectl для продолжения."
    exit 1
fi

# Создание namespace
echo "📝 Создаём namespace..."
kubectl apply -f namespace.yaml

# Применение ConfigMap
echo "⚙️  Применяем ConfigMap..."
kubectl apply -f configmap.yaml

# Проверка наличия secrets
if ! kubectl get secret app-secrets -n $NAMESPACE &> /dev/null; then
    echo "⚠️  Secret app-secrets не найден!"
    
    # Попытка создать из secrets.yaml
    if [ -f "secrets.yaml" ]; then
        echo "📋 Найден secrets.yaml, применяем..."
        kubectl apply -f secrets.yaml
    # Попытка создать из secrets.env
    elif [ -f "secrets.env" ]; then
        echo "📋 Найден secrets.env, создаём secret..."
        kubectl create secret generic app-secrets --from-env-file=secrets.env -n $NAMESPACE
    else
        echo "❌ Файлы secrets.yaml или secrets.env не найдены!"
        echo "📋 Создайте secret командой:"
        echo "   kubectl create secret generic app-secrets --from-env-file=secrets.env -n $NAMESPACE"
        echo "   Или создайте secrets.yaml и примените его: kubectl apply -f secrets.yaml"
        exit 1
    fi
fi

# Деплой Redis
echo "🔴 Деплоим Redis..."
kubectl apply -f redis/pvc.yaml
kubectl apply -f redis/deployment.yaml
kubectl apply -f redis/service.yaml

# Ожидание готовности Redis
echo "⏳ Ожидаем готовности Redis..."
kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=120s

# Обновление образа бэкенда в deployment
if [ "$IMAGE_TAG" != "latest" ]; then
    echo "🔄 Обновляем образ в deployment..."
    sed -i.bak "s|image:.*backend.*|image: $REGISTRY/caloriesapp-backend:$IMAGE_TAG|" backend/deployment.yaml
fi

# Деплой Backend
echo "🔵 Деплоим Backend API..."
kubectl apply -f backend/deployment.yaml
kubectl apply -f backend/service.yaml
kubectl apply -f backend/hpa.yaml

# Деплой Ingress
echo "🌐 Деплоим Ingress..."
kubectl apply -f ingress.yaml

# Ожидание готовности подов
echo "⏳ Ожидаем готовности подов..."
kubectl wait --for=condition=ready pod -l app=backend-api -n $NAMESPACE --timeout=180s

# Показ статуса
echo ""
echo "✅ Деплой завершён!"
echo ""
echo "📊 Статус подов:"
kubectl get pods -n $NAMESPACE

echo ""
echo "🔗 Сервисы:"
kubectl get svc -n $NAMESPACE

echo ""
echo "📈 HPA статус:"
kubectl get hpa -n $NAMESPACE

echo ""
echo "🎉 Готово! Приложение доступно по адресу: https://api.yeb-ich.com"

