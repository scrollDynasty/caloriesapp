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

echo "📦 Preparing archive..."
cd "$(dirname "$0")"

echo "📦 Creating archive..."
tar --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='venv' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.pytest_cache' \
    --exclude='.env' \
    --exclude='.env.prod' \
    --exclude='.env.dev' \
    -czf /tmp/backend.tar.gz .

echo "📤 Uploading to server..."
scp /tmp/backend.tar.gz $SERVER_USER@$SERVER_HOST:/tmp/

echo "⚙️ Extracting on server..."
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
    
    # ВАЖНО: .env файл на сервере НЕ ТРОГАЕТСЯ ВООБЩЕ!
    # Он должен быть настроен вручную один раз и оставаться нетронутым
    if [ ! -f "$REMOTE_DIR/$ENV_FILE" ]; then
        echo "❌ ERROR: $ENV_FILE not found on server!"
        echo "   You must create it manually with real credentials!"
        echo "   Use env.$ENVIRONMENT.sample as a template"
        exit 1
    else
        echo "✅ $ENV_FILE exists on server (not touched, preserved as-is)"
    fi
    
    # Обновляем nginx конфиг только для prod
    if [ "$ENVIRONMENT" = "prod" ] && [ -f "$REMOTE_DIR/nginx/api.yeb-ich.com.conf" ]; then
        echo "📝 Updating nginx config..."
        sudo cp $REMOTE_DIR/nginx/api.yeb-ich.com.conf /etc/nginx/sites-available/api.yeb-ich.com.conf
        sudo nginx -t && sudo systemctl reload nginx
        echo "✅ Nginx reloaded"
    fi
    
    # Выполняем миграции БД
    echo "🗄️  Running database migrations..."
    source $REMOTE_DIR/venv/bin/activate
    cd $REMOTE_DIR
    
    # Загружаем переменные из .env файла безопасным способом
    if [ -f "$REMOTE_DIR/$ENV_FILE" ]; then
        set -a
        source "$REMOTE_DIR/$ENV_FILE"
        set +a
    fi
    
    # Выполняем SQL миграции в порядке (только если переменные БД заданы)
    if [ -d "$REMOTE_DIR/migrations" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
        DB_HOST="${DB_HOST:-localhost}"
        for migration_file in $(ls -1 $REMOTE_DIR/migrations/*.sql 2>/dev/null | sort); do
            if [ -f "$migration_file" ]; then
                echo "  → Running $(basename $migration_file)..."
                migration_output=$(mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_NAME" < "$migration_file" 2>&1)
                migration_exit_code=$?
                if [ $migration_exit_code -eq 0 ]; then
                    echo "  ✓ Migration $(basename $migration_file) completed"
                elif echo "$migration_output" | grep -q "already exists\|Duplicate column\|Table.*already exists"; then
                    echo "  ⚠️  Migration $(basename $migration_file) skipped (already applied)"
                else
                    echo "  ❌ Migration $(basename $migration_file) failed:"
                    echo "$migration_output" | head -5
                fi
            fi
        done
        echo "✅ Database migrations completed"
    else
        if [ ! -d "$REMOTE_DIR/migrations" ]; then
            echo "⚠️  Migrations directory not found, skipping"
        else
            echo "⚠️  Database credentials not found in $ENV_FILE, skipping migrations"
        fi
    fi
    deactivate
    
    # Перезапускаем backend через pm2
    if [ "$ENVIRONMENT" = "prod" ]; then
        PM2_NAME="backend"
    else
        PM2_NAME="backend-dev"
    fi
    if command -v pm2 &> /dev/null; then
        echo "🔄 Restarting backend with pm2 (name: \$PM2_NAME)..."
        cd $REMOTE_DIR
        
        # Останавливаем только конкретный процесс, если он существует
        pm2 stop \$PM2_NAME 2>/dev/null || true
        pm2 delete \$PM2_NAME 2>/dev/null || true
        
        # Проверяем наличие venv и используем его Python
        if [ -d "$REMOTE_DIR/venv/bin" ]; then
            PYTHON_INTERPRETER="$REMOTE_DIR/venv/bin/python3"
            echo "📦 Using Python from venv: \$PYTHON_INTERPRETER"
        else
            PYTHON_INTERPRETER="python3"
            echo "⚠️  venv not found, using system python3"
        fi
        
        # Загружаем переменные окружения из .env для pm2
        set -a
        source "$REMOTE_DIR/$ENV_FILE"
        set +a
        export ENVIRONMENT=$ENVIRONMENT
        export DEBUG=$([ "$ENVIRONMENT" = "dev" ] && echo "true" || echo "false")
        
        # Запускаем новый процесс с правильным интерпретатором
        pm2 start run.py --name \$PM2_NAME --interpreter \$PYTHON_INTERPRETER
        pm2 save
        
        # Проверяем, что процесс запустился успешно
        sleep 2
        if pm2 list | grep -q "\$PM2_NAME.*online"; then
            echo "✅ Backend restarted successfully as \$PM2_NAME"
        else
            echo "❌ ERROR: Backend failed to start!"
            pm2 logs \$PM2_NAME --lines 20
            exit 1
        fi
    else
        echo "⚠️ pm2 not found, skipping backend restart"
    fi
ENDSSH

rm -f /tmp/backend.tar.gz

echo ""
echo "✅ Deployment finished!"
echo "📁 Files location: $REMOTE_DIR"
echo "🌍 Environment: $ENVIRONMENT"
