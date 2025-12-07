#!/bin/bash
# ==========================================
# Deploy Script for Calories App Backend
# Server: api.yeb-ich.com (5.182.33.209)
# Target: /root/backend
# ==========================================

set -e

# Конфигурация
SERVER_USER="root"
SERVER_HOST="api.yeb-ich.com"
REMOTE_DIR="/root/backend"

echo "🚀 Deploying backend folder to $SERVER_HOST..."

# Создаем архив бэкенда
echo "📦 Creating archive..."
cd "$(dirname "$0")"
tar --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='venv' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.pytest_cache' \
    -czf /tmp/backend.tar.gz .

# Копируем на сервер
echo "📤 Uploading to server..."
scp /tmp/backend.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

# Распаковываем на сервере
echo "⚙️ Extracting on server..."
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
    mkdir -p /root/backend
    cd /root/backend
    tar -xzf /tmp/backend.tar.gz
    rm /tmp/backend.tar.gz
    echo "✅ Files deployed to /root/backend"
ENDSSH

# Очистка
rm /tmp/backend.tar.gz

echo ""
echo "✅ Deployment finished!"
echo "📁 Files location: /root/backend"
