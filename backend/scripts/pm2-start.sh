#!/bin/bash

cd "$(dirname "$0")/.."

if ! command -v pm2 &> /dev/null; then
    echo "PM2 not installed. Install: npm install -g pm2"
    exit 1
fi

if [ ! -f .env ]; then
    echo ".env file not found"
    exit 1
fi

mkdir -p logs
pm2 start ecosystem.config.js
pm2 save

echo "Backend started"
echo "Commands: pm2 status, pm2 logs caloriesapp-backend, pm2 restart caloriesapp-backend"
