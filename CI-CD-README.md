# CI/CD и Dev/Prod окружения

## Обзор

Проект настроен для работы в двух режимах:
- **Development (dev)** - для разработки и тестирования
- **Production (prod)** - для продакшн сервера

## Быстрый старт

### Backend

#### Локальная разработка
```bash
cd backend
./scripts/switch-env.sh dev
python3 run.py
```

#### Переключение окружения
```bash
cd backend
./scripts/switch-env.sh dev   # для разработки
./scripts/switch-env.sh prod  # для production
```

#### Деплой на сервер
```bash
cd backend
./deploy.sh prod   # деплой в production
./deploy.sh dev    # деплой в development
```

### Web

#### Локальная разработка
```bash
cd web
npm run dev
```

#### Сборка
```bash
cd web
npm run build
```

## GitHub Actions CI/CD

### Настройка

1. **Добавьте SSH ключ в GitHub Secrets:**
   - 📖 **Подробная инструкция**: См. файл `SETUP-SSH-KEYS.md`
   - Кратко: Перейдите в Settings → Secrets and variables → Actions
   - Добавьте секрет `SSH_PRIVATE_KEY` с содержимым вашего приватного SSH ключа
   - **Важно**: Нужен доступ к `scroll@api.yeb-ich.com` (backend) и `scroll@yeb-ich.com` (web)

2. **Workflows автоматически запускаются:**
   - При push в `master` → деплой в **production**
   - При push в `develop` → деплой в **development**
   - При Pull Request → только проверки (без деплоя)

### Проверки в CI/CD

#### Backend
- ✅ Code formatting (Black)
- ✅ Linting (flake8)
- ✅ Type checking (mypy)
- ✅ Import validation
- ✅ Environment configuration validation

#### Web
- ✅ Linting (Biome)
- ✅ Format checking (Biome)
- ✅ Build verification

## Структура окружений

### Backend

| Параметр | Development | Production |
|----------|-------------|------------|
| **ENVIRONMENT** | `development` | `production` |
| **DEBUG** | `true` | `false` |
| **DB_NAME** | `caloriesapp` | `caloriesapp` |
| **API_DOMAIN** | `http://localhost:8000` | `https://api.yeb-ich.com` |
| **Server Path** | `/home/scroll/backend-dev` | `/home/scroll/backend` |
| **PM2 Name** | `backend-dev` | `backend-prod` |

### Web

| Параметр | Development | Production |
|----------|-------------|------------|
| **NODE_ENV** | `development` | `production` |
| **Server Path** | `/var/www/yeb-ich.com/html-dev` | `/var/www/yeb-ich.com/html` |

## Файлы окружений

### Backend

- `env.dev.sample` - шаблон для development
- `env.prod.sample` - шаблон для production
- `.env` - текущий активный файл (не коммитится в git)

**Создание .env:**
```bash
cd backend
cp env.dev.sample .env    # для разработки
# или
cp env.prod.sample .env   # для production
```

### Web

Next.js использует встроенные переменные окружения. Для кастомных переменных создайте `.env.local` (не коммитится в git).

## Деплой

### Автоматический (через GitHub Actions)

1. Сделайте изменения в коде
2. Закоммитьте и запушьте в `main` (prod) или `develop` (dev)
3. GitHub Actions автоматически:
   - Запустит проверки
   - Соберет проект
   - Задеплоит на сервер (если проверки прошли)

### Ручной деплой

#### Backend
```bash
cd backend
./deploy.sh prod   # или dev
```

#### Web
```bash
cd web
# Windows
deploy.bat

# Linux/Mac
npm run build
# затем загрузите out/ на сервер
```

## Проверка статуса после деплоя

### Backend
```bash
ssh scroll@api.yeb-ich.com
pm2 list
pm2 logs backend-prod  # или backend-dev
```

### Web
```bash
ssh root@yeb-ich.com
ls -la /var/www/yeb-ich.com/html
nginx -t
systemctl status nginx
```

## Откат изменений

Если что-то пошло не так:

### Backend
```bash
ssh scroll@api.yeb-ich.com
cd /home/scroll/backend
pm2 restart backend-prod
pm2 logs backend-prod --lines 50
```

### Web
```bash
ssh root@yeb-ich.com
cd /var/www/yeb-ich.com/html
# Восстановите из backup если нужно
cp -r backup/* .
systemctl reload nginx
```

## Безопасность

### Production требования

- ✅ `DEBUG=false` в production
- ✅ Надежный `JWT_SECRET_KEY` (минимум 32 символа)
- ✅ CORS настроен только для production доменов
- ✅ Admin панель отключена в production (docs_url=None)

### Проверка безопасности

Backend автоматически проверяет настройки безопасности при запуске:
- В production: ошибки безопасности блокируют запуск
- В development: только предупреждения

## Troubleshooting

### Backend не запускается

1. Проверьте `.env` файл:
   ```bash
   cd backend
   cat .env
   ```

2. Проверьте переменные окружения:
   ```bash
   export ENVIRONMENT=development
   export DEBUG=true
   python3 run.py
   ```

3. Проверьте логи:
   ```bash
   pm2 logs backend-prod
   ```

### Web не собирается

1. Очистите кэш:
   ```bash
   cd web
   rm -rf .next out node_modules
   npm ci
   npm run build
   ```

2. Проверьте версию Node.js:
   ```bash
   node --version  # должна быть 20.x
   ```

### CI/CD не работает

1. Проверьте SSH ключ в GitHub Secrets
2. Проверьте права доступа на сервере
3. Проверьте логи в GitHub Actions

## Дополнительная документация

- [Backend Deploy Guide](backend/README-DEPLOY.md)
- [Web Deploy Guide](web/README-DEPLOY.md)

