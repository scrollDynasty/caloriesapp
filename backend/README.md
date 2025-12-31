# 🚀 CaloriesApp Backend - Инструкция по запуску

## Быстрый старт

### 1. Настройка окружения

```bash
# Скопируйте .env если его нет
cp env.prod.sample .env

# Отредактируйте настройки
nano .env
```

### 2. Установка зависимостей

```bash
# Создайте venv если его нет
python3 -m venv venv
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

### 3. Запуск через PM2

```bash
./scripts/pm2-start.sh
```

Или вручную:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Настроить автозапуск при загрузке системы
```

---

## 📝 Основные команды

### PM2

```bash
pm2 status                      # Статус
pm2 logs caloriesapp-backend    # Логи
pm2 restart caloriesapp-backend # Перезапуск
pm2 stop caloriesapp-backend   # Остановка
pm2 monit                       # Мониторинг
```

---

## ⚙️ Конфигурация

### Backend (в `ecosystem.config.js`)

- **Порт:** 8000
- **Workers:** 4
- **Логи:** `./logs/pm2-*.log`

---

## 🔍 Проверка работы

```bash
# Backend
curl http://localhost:8000/health
```

---

## ❓ Проблемы?

### Backend не запускается

```bash
pm2 logs caloriesapp-backend --err
pm2 describe caloriesapp-backend
```

### Не подключается к MySQL

```bash
mysql -h localhost -u root -p -e "SELECT 1"
```
