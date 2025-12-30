# Настройка sudo для автоматического деплоя

## Проблема

Пользователь `scroll` не имеет прав на выполнение команд в `/var/www/yeb-ich.com/` без пароля, что необходимо для автоматического деплоя через GitHub Actions.

## Решение

Нужно создать файл в `/etc/sudoers.d/` с правилами для пользователя `scroll`.

### Шаг 1: Подключитесь к серверу

```bash
ssh scroll@yeb-ich.com
```

### Шаг 2: Создайте файл с правилами sudo

```bash
sudo visudo -f /etc/sudoers.d/scroll-deploy
```

### Шаг 3: Добавьте следующее содержимое

```bash
# Правила для автоматического деплоя через GitHub Actions
# Пользователь scroll может выполнять команды для деплоя без пароля

scroll ALL=(ALL) NOPASSWD: /bin/mkdir -p /var/www/yeb-ich.com/*
scroll ALL=(ALL) NOPASSWD: /bin/rm -rf /var/www/yeb-ich.com/*
scroll ALL=(ALL) NOPASSWD: /bin/mv /var/www/yeb-ich.com/*
scroll ALL=(ALL) NOPASSWD: /bin/cp -r /var/www/yeb-ich.com/*
scroll ALL=(ALL) NOPASSWD: /bin/chown -R www-data\:www-data /var/www/yeb-ich.com/*
scroll ALL=(ALL) NOPASSWD: /bin/chmod -R [0-9]* /var/www/yeb-ich.com/*
scroll ALL=(ALL) NOPASSWD: /usr/sbin/nginx -t
scroll ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
```

**Важно**: После добавления сохраните файл (в `visudo` это обычно `Ctrl+X`, затем `Y`, затем `Enter`).

### Шаг 4: Проверьте синтаксис

```bash
sudo visudo -c
```

Должно вывести: `/etc/sudoers.d/scroll-deploy: parsed OK`

### Шаг 5: Проверьте работу

```bash
# Проверьте, что sudo работает без пароля
sudo -n mkdir -p /var/www/yeb-ich.com/test
sudo -n rm -rf /var/www/yeb-ich.com/test

# Если команды выполнились без запроса пароля - всё настроено правильно!
```

## Альтернативный вариант (менее безопасный)

Если нужен более широкий доступ (не рекомендуется):

```bash
# В файле /etc/sudoers.d/scroll-deploy:
scroll ALL=(ALL) NOPASSWD: ALL
```

Это даст полный доступ без пароля, что менее безопасно, но проще в настройке.

## Безопасность

- Файлы в `/etc/sudoers.d/` автоматически включаются в конфигурацию sudo
- Используйте минимально необходимые права
- Регулярно проверяйте, кто имеет доступ к серверу

## Устранение проблем

### Ошибка: "syntax error near line X"

- Проверьте синтаксис: `sudo visudo -c`
- Убедитесь, что нет лишних пробелов
- Проверьте экранирование специальных символов (например, `:` в `www-data:www-data`)

### Команды всё ещё требуют пароль

- Проверьте, что файл создан: `ls -la /etc/sudoers.d/scroll-deploy`
- Проверьте права доступа: `sudo chmod 0440 /etc/sudoers.d/scroll-deploy`
- Проверьте синтаксис: `sudo visudo -c`

