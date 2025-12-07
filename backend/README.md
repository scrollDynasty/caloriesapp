# Calories App Backend

FastAPI бэкенд для приложения подсчета калорий.

## Архитектура

Проект организован по принципам чистой архитектуры:

```
backend/
├── app/
│   ├── api/              # API роутеры
│   │   └── v1/          # Версия API
│   │       ├── auth.py   # Роуты аутентификации
│   │       └── onboarding.py  # Роуты онбординга
│   ├── core/            # Ядро приложения
│   │   ├── config.py    # Конфигурация
│   │   ├── database.py  # Настройка БД
│   │   └── dependencies.py  # Зависимости FastAPI
│   ├── models/          # SQLAlchemy модели
│   │   ├── user.py
│   │   └── onboarding_data.py
│   ├── schemas/         # Pydantic схемы
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── onboarding.py
│   ├── services/        # Бизнес-логика
│   │   ├── user_service.py
│   │   └── onboarding_service.py
│   ├── utils/           # Утилиты
│   │   ├── auth.py      # JWT аутентификация
│   │   └── oauth.py     # OAuth провайдеры
│   └── main.py          # Точка входа FastAPI
├── .env                  # Конфигурация (не в git)
├── .env.example         # Пример конфигурации
├── requirements.txt     # Зависимости
└── README.md           # Документация
```

## Принципы архитектуры

- **Разделение ответственности**: Каждый модуль отвечает за свою область
- **Dependency Injection**: Использование FastAPI dependencies
- **Сервисный слой**: Бизнес-логика отделена от API
- **Версионирование API**: Поддержка версий через `/api/v1/`
- **Типизация**: Использование type hints везде

## Требования

- Python 3.12+
- MariaDB/MySQL
- pip

## Установка

1. Создайте виртуальное окружение:
```bash
python3.12 -m venv venv
source venv/bin/activate  # Linux/Mac
# или
venv\Scripts\activate  # Windows
```

2. Установите зависимости:
```bash
pip install -r requirements.txt
```

3. Настройте `.env` файл:
```bash
cp .env.example .env
# Отредактируйте .env файл с вашими настройками
```

4. Создайте базу данных:

**Вариант 1: Автоматически (рекомендуется)**
```bash
# Используйте скрипт инициализации
./scripts/init_db.sh
```

**Вариант 2: Вручную через MySQL**
```bash
mysql -u root -p < init_database.sql
```

**Вариант 3: Через MySQL консоль**
```sql
CREATE DATABASE caloriesapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Таблицы создадутся автоматически при первом запуске приложения через SQLAlchemy.

5. Запустите сервер:
```bash
python run.py
# или
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## Конфигурация

### Локальная разработка

В `.env` файле:
- `ENVIRONMENT=development`
- `HOST=0.0.0.0` (для доступа из локальной сети)
- `PORT=8000`
- Добавьте ваш локальный IP в `CORS_ORIGINS`: `http://192.168.1.100:3000`

### Продакшен

В `.env` файле:
- `ENVIRONMENT=production`
- `DEBUG=False`
- Настройте реальные OAuth credentials

## API Endpoints

### Аутентификация

- `POST /api/v1/auth/google` - Вход через Google
- `POST /api/v1/auth/apple` - Вход через Apple
- `GET /api/v1/auth/me` - Получить информацию о текущем пользователе

### Данные онбординга

- `POST /api/v1/onboarding` - Сохранить данные онбординга (требует аутентификации)
- `GET /api/v1/onboarding` - Получить данные онбординга (требует аутентификации)

### Системные

- `GET /` - Информация об API
- `GET /health` - Проверка здоровья сервера

## Доступ из локальной сети

Для тестирования с телефона:

1. Узнайте ваш локальный IP:
```bash
# Linux/Mac
ip addr show | grep "inet " | grep -v 127.0.0.1
# или
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
```

2. Добавьте IP в `CORS_ORIGINS` в `.env`:
```
CORS_ORIGINS=http://localhost:3000,http://192.168.1.100:3000,exp://192.168.1.100:8081
```

3. Запустите сервер с `HOST=0.0.0.0`

4. Подключитесь с телефона по адресу: `http://192.168.1.100:8000`

## База данных

### Создание базы данных

**Важно:** Саму базу данных нужно создать вручную. Таблицы создадутся автоматически при первом запуске.

**Способы создания:**

1. **Автоматически (скрипт):**
```bash
./scripts/init_db.sh
```

2. **Вручную через MySQL:**
```bash
mysql -u root -p < init_database.sql
```

3. **Через MySQL консоль:**
```sql
CREATE DATABASE caloriesapp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Проверка подключения

Проверить подключение к БД можно скриптом:
```bash
python scripts/check_db.py
```

### Таблицы

Таблицы создаются автоматически при первом запуске через `init_db()`:

- `users` - Пользователи
- `onboarding_data` - Данные онбординга

## Разработка

### Структура модулей

- **API Layer** (`app/api/`): Обработка HTTP запросов
- **Service Layer** (`app/services/`): Бизнес-логика
- **Data Layer** (`app/models/`): Модели базы данных
- **Schema Layer** (`app/schemas/`): Валидация данных

### Добавление нового endpoint

1. Создайте роутер в `app/api/v1/`
2. Добавьте бизнес-логику в `app/services/`
3. Создайте схемы в `app/schemas/`
4. Подключите роутер в `app/main.py`
