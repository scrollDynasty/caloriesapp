@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set SERVER_USER=root
set SERVER_HOST=yeb-ich.com
set REMOTE_DIR=/var/www/yeb-ich.com/html

echo [INFO] Deploying web folder to %SERVER_HOST%...

echo [INFO] Building Next.js application...
cd /d "%~dp0"

if exist .next rmdir /s /q .next
if exist out rmdir /s /q out

call npm ci
if errorlevel 1 (
    echo [ERROR] npm ci failed!
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo [ERROR] npm run build failed!
    exit /b 1
)

echo [INFO] Creating archive of built files...

where tar >nul 2>nul
if errorlevel 1 (
    echo [ERROR] tar command not found. Please install Git Bash or WSL.
    echo [INFO] Alternatively, you can use WSL or create the archive manually.
    exit /b 1
)

set TEMP_ARCHIVE=%TEMP%\web_%RANDOM%.tar.gz

cd out
tar -czf "%TEMP_ARCHIVE%" .
if errorlevel 1 (
    echo [ERROR] Archive creation failed!
    exit /b 1
)
cd ..

echo [INFO] Uploading to server...
scp "%TEMP_ARCHIVE%" %SERVER_USER%@%SERVER_HOST%:/tmp/web.tar.gz
if errorlevel 1 (
    echo [ERROR] Upload failed!
    del "%TEMP_ARCHIVE%" 2>nul
    exit /b 1
)

echo [INFO] Extracting and deploying on server...
ssh %SERVER_USER%@%SERVER_HOST% "set -e && REMOTE_DIR='/var/www/yeb-ich.com/html' && mkdir -p $REMOTE_DIR && if [ -d '$REMOTE_DIR/current' ]; then echo '[INFO] Backing up current version...' && rm -rf $REMOTE_DIR/backup && mv $REMOTE_DIR/current $REMOTE_DIR/backup; fi && mkdir -p $REMOTE_DIR/current && cd $REMOTE_DIR/current && tar -xzf /tmp/web.tar.gz && rm /tmp/web.tar.gz && cd $REMOTE_DIR && rm -rf *.html *.js *.json _next 2>/dev/null || true && cp -r current/* . && chown -R www-data:www-data $REMOTE_DIR && chmod -R 755 $REMOTE_DIR && if nginx -t; then systemctl reload nginx && echo '[OK] Nginx reloaded successfully'; else echo '[ERROR] Nginx configuration error!' && exit 1; fi && echo '[OK] Files deployed successfully'"

if errorlevel 1 (
    echo [ERROR] Deployment failed!
    del "%TEMP_ARCHIVE%" 2>nul
    exit /b 1
)

del "%TEMP_ARCHIVE%" 2>nul

echo.
echo [OK] Deployment finished!
echo [INFO] Files location: %REMOTE_DIR%
