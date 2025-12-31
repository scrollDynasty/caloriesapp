#!/bin/bash

if ! command -v pm2 &> /dev/null; then
    echo "PM2 not installed"
    exit 1
fi

pm2 stop caloriesapp-backend
pm2 save

echo "Backend stopped"
