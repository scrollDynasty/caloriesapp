set -e

SERVER_USER="root"
SERVER_HOST="api.yeb-ich.com"
REMOTE_DIR="/root/backend"

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
    mkdir -p /root/backend
    cd /root/backend
    tar -xzf /tmp/backend.tar.gz
    rm /tmp/backend.tar.gz
    echo "✅ Files deployed to /root/backend"
ENDSSH

rm /tmp/backend.tar.gz

echo ""
echo "✅ Deployment finished!"
echo "📁 Files location: /root/backend"
