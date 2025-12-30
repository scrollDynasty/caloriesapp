# Руководство по развертыванию Web

## Переключение между Dev и Prod режимами

### Локальная разработка

#### Запуск в режиме разработки
```bash
npm run dev
```

#### Сборка для production
```bash
npm run build
npm start
```

### CI/CD с GitHub Actions

Workflow автоматически:
- Проверяет код с помощью Biome (lint, format)
- Собирает Next.js приложение
- Деплоит на сервер при push в `main` (prod) или `develop` (dev)

### Деплой на сервер

#### Структура на сервере
- **Production**: `/var/www/yeb-ich.com/html`
- **Development**: `/var/www/yeb-ich.com/html-dev`

#### Ручной деплой (Windows)
```bash
deploy.bat
```

#### Ручной деплой (Linux/Mac)
```bash
# Production
npm run build
cd out
tar -czf /tmp/web.tar.gz .
scp /tmp/web.tar.gz root@yeb-ich.com:/tmp/
ssh root@yeb-ich.com "cd /var/www/yeb-ich.com/html && tar -xzf /tmp/web.tar.gz && systemctl reload nginx"
```

## Переменные окружения

Next.js автоматически использует:
- `NODE_ENV=production` для production сборки
- `NODE_ENV=development` для development режима

## Проверка статуса

После деплоя проверьте:
```bash
# На сервере
ls -la /var/www/yeb-ich.com/html
nginx -t
systemctl status nginx
```

