set -e

ENVIRONMENT="${1:-prod}"

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    echo "❌ Ошибка: Неверное окружение. Используйте 'dev' или 'prod'"
    echo "Использование: $0 [dev|prod]"
    exit 1
fi

if [ "$ENVIRONMENT" = "prod" ]; then
    SERVER_USER="scroll"
    SERVER_HOST="api.yeb-ich.com"
    REMOTE_DIR="/home/scroll/backend"
    ENV_FILE=".env"
    echo "🚀 Deploying backend to PRODUCTION ($SERVER_HOST)..."
else
    SERVER_USER="scroll"
    SERVER_HOST="api.yeb-ich.com"
    REMOTE_DIR="/home/scroll/backend-dev"
    ENV_FILE=".env.dev"
    echo "🚀 Deploying backend to DEVELOPMENT ($SERVER_HOST)..."
fi

echo "📋 Environment: $ENVIRONMENT"
echo "📁 Remote directory: $REMOTE_DIR"

echo "📦 Creating archive..."
cd "$(dirname "$0")"
tar --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='venv' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.pytest_cache' \
    -czf /tmp/backend.tar.gz .

echo "📤 Uploading to server..."
scp /tmp/backend.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

echo "⚙️ Extracting on server..."
# Определяем имя PM2 процесса
if [ "$ENVIRONMENT" = "prod" ]; then
    PM2_NAME="backend"
else
    PM2_NAME="backend-dev"
fi

ssh $SERVER_USER@$SERVER_HOST << ENDSSH
    set -e
    mkdir -p $REMOTE_DIR
    cd $REMOTE_DIR
    tar -xzf /tmp/backend.tar.gz
    rm /tmp/backend.tar.gz
    echo "✅ Files deployed to $REMOTE_DIR"
    
    # Создаём и активируем venv если его нет
    if [ ! -d "$REMOTE_DIR/venv" ]; then
        echo "📦 Creating virtual environment..."
        python3 -m venv $REMOTE_DIR/venv
    fi
    
    # Устанавливаем зависимости
    echo "📦 Installing dependencies..."
    source $REMOTE_DIR/venv/bin/activate
    pip install --upgrade pip
    pip install -r $REMOTE_DIR/requirements.txt
    deactivate
    
    # Устанавливаем переменную окружения
    export ENVIRONMENT=$ENVIRONMENT
    export DEBUG=$([ "$ENVIRONMENT" = "dev" ] && echo "true" || echo "false")
    
    # Проверяем наличие .env файла
    if [ ! -f "$REMOTE_DIR/$ENV_FILE" ]; then
        echo "⚠️  Warning: $ENV_FILE not found. Creating from sample..."
        if [ -f "$REMOTE_DIR/env.$ENVIRONMENT.sample" ]; then
            cp "$REMOTE_DIR/env.$ENVIRONMENT.sample" "$REMOTE_DIR/$ENV_FILE"
            echo "✅ Created $ENV_FILE from sample. Please update it with real values!"
        else
            echo "❌ Error: env.$ENVIRONMENT.sample not found!"
            exit 1
        fi
    fi
    
    # Обновляем nginx конфиг только для prod
    if [ "$ENVIRONMENT" = "prod" ] && [ -f "$REMOTE_DIR/nginx/api.yeb-ich.com.conf" ]; then
        echo "📝 Updating nginx config..."
        sudo cp $REMOTE_DIR/nginx/api.yeb-ich.com.conf /etc/nginx/sites-available/api.yeb-ich.com.conf
        sudo nginx -t && sudo systemctl reload nginx
        echo "✅ Nginx reloaded"
    fi
    
    # Перезапускаем backend через pm2
    if [ "$ENVIRONMENT" = "prod" ]; then
        PM2_NAME="backend"
    else
        PM2_NAME="backend-dev"
    fi
    if command -v pm2 &> /dev/null; then
        echo "🔄 Restarting backend with pm2 (name: \$PM2_NAME)..."
        cd $REMOTE_DIR
        
        # Удаляем все процессы с неправильными именами и старые процессы
        pm2 delete all 2>/dev/null || true
        
        # Проверяем наличие venv и используем его Python
        if [ -d "$REMOTE_DIR/venv/bin" ]; then
            PYTHON_INTERPRETER="$REMOTE_DIR/venv/bin/python3"
            echo "📦 Using Python from venv: \$PYTHON_INTERPRETER"
        else
            PYTHON_INTERPRETER="python3"
            echo "⚠️  venv not found, using system python3"
        fi
        
        # Запускаем новый процесс с правильным интерпретатором
        pm2 start run.py --name \$PM2_NAME --interpreter \$PYTHON_INTERPRETER
        pm2 save
        echo "✅ Backend restarted as \$PM2_NAME"
    else
        echo "⚠️ pm2 not found, skipping backend restart"
    fi
ENDSSH

rm -f /tmp/backend.tar.gz

echo ""
echo "✅ Deployment finished!"
echo "📁 Files location: $REMOTE_DIR"
echo "🌍 Environment: $ENVIRONMENT"
