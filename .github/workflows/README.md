# GitHub Actions Workflows

## Backend CI/CD (`backend-ci.yml`)

Автоматизирует проверку и деплой backend приложения.

### Триггеры
- Push в `master` → деплой в production
- Push в `develop` → деплой в development
- Pull Request → только проверки

### Этапы
1. **Lint and Test**
   - Установка Python 3.11
   - Установка зависимостей
   - Проверка форматирования (Black)
   - Линтинг (flake8)
   - Проверка типов (mypy)
   - Валидация импортов
   - Проверка конфигурации

2. **Deploy to Production** (только для `master`)
   - Настройка SSH
   - Деплой через `deploy.sh prod`

3. **Deploy to Development** (только для `develop`)
   - Настройка SSH
   - Деплой через `deploy.sh dev`

### Требования
- GitHub Secret: `SSH_PRIVATE_KEY` (приватный SSH ключ для доступа к серверу)

## Web CI/CD (`web-ci.yml`)

Автоматизирует проверку и деплой web приложения.

### Триггеры
- Push в `master` → деплой в production
- Push в `develop` → деплой в development
- Pull Request → только проверки

### Этапы
1. **Lint and Build**
   - Установка Node.js 20
   - Установка зависимостей
   - Линтинг (Biome)
   - Проверка форматирования (Biome)
   - Сборка Next.js приложения

2. **Deploy to Production** (только для `master`)
   - Сборка для production
   - Создание архива
   - Деплой на сервер

3. **Deploy to Development** (только для `develop`)
   - Сборка для development
   - Создание архива
   - Деплой на development сервер

### Требования
- GitHub Secret: `SSH_PRIVATE_KEY` (приватный SSH ключ для доступа к серверу)

## Настройка

1. Перейдите в Settings → Secrets and variables → Actions
2. Добавьте новый секрет:
   - Name: `SSH_PRIVATE_KEY`
   - Value: содержимое вашего приватного SSH ключа (начинается с `-----BEGIN OPENSSH PRIVATE KEY-----`)

## Мониторинг

Проверьте статус workflow:
- GitHub → Actions → выберите нужный workflow
- Просмотрите логи каждого этапа

## Отладка

Если деплой не работает:
1. Проверьте SSH ключ в Secrets
2. Проверьте права доступа на сервере
3. Проверьте логи в GitHub Actions
4. Проверьте подключение к серверу вручную:
   ```bash
   ssh scroll@api.yeb-ich.com
   ssh root@yeb-ich.com
   ```

