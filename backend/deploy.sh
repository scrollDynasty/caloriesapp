set -e

SERVER_USER="scroll"
SERVER_HOST="api.yeb-ich.com"
REMOTE_DIR="/home/scroll/backend"

echo "🚀 Deploying backend folder to $SERVER_HOST..."

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
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
    mkdir -p /home/scroll/backend
    cd /home/scroll/backend
    tar -xzf /tmp/backend.tar.gz
    rm /tmp/backend.tar.gz
    echo "✅ Files deployed to /home/scroll/backend"
    
    # Обновляем nginx конфиг
    if [ -f "/home/scroll/backend/nginx/api.yeb-ich.com.conf" ]; then
        echo "📝 Updating nginx config..."
        sudo cp /home/scroll/backend/nginx/api.yeb-ich.com.conf /etc/nginx/sites-available/api.yeb-ich.com.conf
        sudo nginx -t && sudo systemctl reload nginx
        echo "✅ Nginx reloaded"
    fi
    
    # Перезапускаем backend через pm2
    if command -v pm2 &> /dev/null; then
        echo "🔄 Restarting backend with pm2..."
        pm2 restart backend || pm2 start /home/scroll/backend/run.py --name backend --interpreter python3
        echo "✅ Backend restarted"
    else
        echo "⚠️ pm2 not found, skipping backend restart"
    fi
ENDSSH

rm /tmp/backend.tar.gz

echo ""
echo "✅ Deployment finished!"
echo "📁 Files location: /home/scroll/backend"
