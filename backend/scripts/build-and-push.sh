#!/bin/bash

# Скрипт для сборки и загрузки Docker образа
# Использование: ./build-and-push.sh [tag]

set -e

REGISTRY=${DOCKER_REGISTRY:-"your-registry"}  # Замените на ваш registry
IMAGE_NAME="caloriesapp-backend"
TAG=${1:-"latest"}

FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${TAG}"

echo "🔨 Собираем Docker образ..."
docker build -t ${FULL_IMAGE_NAME} .

echo "📤 Загружаем образ в registry..."
docker push ${FULL_IMAGE_NAME}

echo "✅ Образ ${FULL_IMAGE_NAME} успешно загружен!"

# Опционально: создание latest тега
if [ "$TAG" != "latest" ]; then
    echo "🏷️  Создаём latest тег..."
    docker tag ${FULL_IMAGE_NAME} ${REGISTRY}/${IMAGE_NAME}:latest
    docker push ${REGISTRY}/${IMAGE_NAME}:latest
fi

echo "🎉 Готово! Используйте образ: ${FULL_IMAGE_NAME}"

