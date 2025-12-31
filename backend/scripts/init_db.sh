#!/bin/bash

echo "Initializing caloriesapp database..."

DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-caloriesapp}"

echo "Creating database $DB_NAME..."

if [ -z "$DB_PASSWORD" ]; then
    mysql -u "$DB_USER" -h "$DB_HOST" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;
EOF
else
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;
EOF
fi

if [ $? -eq 0 ]; then
    echo "Database $DB_NAME created successfully"
else
    echo "Error creating database"
    exit 1
fi

echo "Database initialization complete"
