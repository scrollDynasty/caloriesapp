# Руководство по развертыванию Backend

## Переключение между Dev и Prod режимами

### Локальная разработка

#### Переключение окружения и запуск
```bash
# Переключиться на dev окружение и запустить
./scripts/switch-env.sh dev
python3 run.py

# Переключиться на prod окружение и запустить
./scripts/switch-env.sh prod
python3 run.py
```

### Настройка .env файлов

1. **Development**: Скопируйте `env.dev.sample` в `.env` и заполните значениями
2. **Production**: Скопируйте `env.prod.sample` в `.env` и заполните значениями

**Важно**: 
- В production обязательно установите надежный `JWT_SECRET_KEY` (минимум 32 символа)
- Не коммитьте `.env` файлы в git!

### Деплой на сервер

#### Деплой в Production
```bash
./deploy.sh prod
```

#### Деплой в Development
```bash
./deploy.sh dev
```

Скрипт автоматически:
- Создает архив backend папки
- Загружает на сервер
- Распаковывает в соответствующую директорию
- Обновляет nginx конфиг (только для prod)
- Перезапускает приложение через pm2

**Структура на сервере:**
- Production: `/home/scroll/backend`
- Development: `/home/scroll/backend-dev`

**PM2 процессы:**
- Production: `backend-prod`
- Development: `backend-dev`

## CI/CD с GitHub Actions

### Настройка

1. Добавьте SSH ключ в GitHub Secrets:
   - Перейдите в Settings → Secrets and variables → Actions
   - Добавьте `SSH_PRIVATE_KEY` с содержимым вашего приватного SSH ключа

2. Workflow автоматически запускается при:
   - Push в `main` → деплой в production
   - Push в `develop` → деплой в development
   - Pull Request → только проверки (lint, build, tests)

### Проверки в CI/CD

- **Lint**: Black, flake8, mypy
- **Build**: Проверка импортов и валидация конфигурации
- **Deploy**: Автоматический деплой после успешных проверок

## Переменные окружения

### Основные переменные

| Переменная | Описание | Dev | Prod |
|------------|----------|-----|------|
| `ENVIRONMENT` | Режим работы | `development` | `production` |
| `DEBUG` | Режим отладки | `true` | `false` |
| `DB_HOST` | Хост БД | `localhost` | `localhost` |
| `DB_NAME` | Имя БД | `caloriesapp` | `caloriesapp` |
| `API_DOMAIN` | Домен API | `http://localhost:8000` | `https://api.yeb-ich.com` |

### Безопасность

В production режиме:
- `DEBUG` должен быть `false`
- `JWT_SECRET_KEY` должен быть надежным (минимум 32 символа)
- CORS разрешает только production домены
- Admin панель доступна только в dev режиме (через `docs_url`)

## Проверка статуса

После деплоя проверьте:
```bash
# На сервере
pm2 list
pm2 logs backend-prod  # или backend-dev
```

## Откат изменений

Если что-то пошло не так:
```bash
# На сервере
cd /home/scroll/backend
pm2 restart backend-prod
# или
pm2 logs backend-prod --lines 50
```

