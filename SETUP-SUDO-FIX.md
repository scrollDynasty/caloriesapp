# Исправление правил sudo для деплоя

## Проблема

Sudo всё ещё запрашивает пароль, несмотря на настройку NOPASSWD.

## Решение

Нужно использовать более широкие правила или точно указать все команды.

### Вариант 1: Более широкие правила (рекомендуется)

Подключитесь к серверу и отредактируйте файл:

```bash
ssh scroll@yeb-ich.com
sudo visudo -f /etc/sudoers.d/scroll-deploy
```

Замените содержимое на:

```bash
# Правила для автоматического деплоя через GitHub Actions
# Пользователь scroll может выполнять команды для деплоя без пароля

# Разрешить все команды для работы с /var/www/yeb-ich.com/
scroll ALL=(ALL) NOPASSWD: /bin/mkdir, /bin/rm, /bin/mv, /bin/cp, /bin/chown, /bin/chmod
scroll ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /bin/systemctl
```

**Важно**: Сохраните файл (`Ctrl+X`, затем `Y`, затем `Enter`)

Затем проверьте:
```bash
sudo chmod 0440 /etc/sudoers.d/scroll-deploy
sudo visudo -c
```

### Вариант 2: Полный доступ без пароля (менее безопасно, но проще)

Если вариант 1 не работает, используйте:

```bash
scroll ALL=(ALL) NOPASSWD: ALL
```

Это даст полный доступ без пароля, что менее безопасно, но гарантированно работает.

### Проверка

После настройки проверьте на сервере:

```bash
# Проверьте, что sudo работает без пароля
sudo -n mkdir -p /var/www/yeb-ich.com/test
sudo -n rm -rf /var/www/yeb-ich.com/test
sudo -n chown -R www-data:www-data /var/www/yeb-ich.com/test 2>/dev/null || true
sudo -n nginx -t
```

Если все команды выполнились без запроса пароля - всё настроено правильно!

