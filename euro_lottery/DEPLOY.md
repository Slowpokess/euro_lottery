# Инструкция по развертыванию Euro Lottery

Данная инструкция описывает полный процесс развертывания проекта Euro Lottery на продакшен-сервере.

## Предварительные требования

### Системные требования
- Ubuntu 22.04 или другой Linux-дистрибутив
- Python 3.9+
- Node.js 16+
- PostgreSQL 13+
- Redis 6+
- Nginx
- Supervisor
- Certbot (для SSL)

### Внешние сервисы
Для работы системы необходимо зарегистрироваться и получить API-ключи в следующих сервисах:

1. **Stripe** - для обработки платежей
   - Зарегистрируйтесь на [https://stripe.com](https://stripe.com)
   - Создайте аккаунт и получите тестовые/продакшн API-ключи
   - Настройте webhook для уведомлений о платежах

2. **PayPal** - альтернативная платежная система
   - Зарегистрируйтесь на [https://developer.paypal.com](https://developer.paypal.com)
   - Создайте приложение и получите Client ID и Secret
   - Настройте webhook для уведомлений

3. **Gmail** или другой SMTP-сервис для отправки email
   - Если используете Gmail, создайте пароль приложения в настройках безопасности

## Подготовка сервера

### 1. Установка зависимостей

```bash
# Обновление пакетов
sudo apt update
sudo apt upgrade -y

# Установка основных зависимостей
sudo apt install -y python3 python3-pip python3-venv python3-dev
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y redis-server
sudo apt install -y nginx
sudo apt install -y supervisor
sudo apt install -y git curl
sudo apt install -y build-essential

# Установка Node.js и npm
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
```

### 2. Настройка PostgreSQL

```bash
# Создаем пользователя и базу данных
sudo -u postgres psql -c "CREATE USER euro_lottery WITH PASSWORD 'ваш_сложный_пароль';"
sudo -u postgres psql -c "CREATE DATABASE euro_lottery OWNER euro_lottery;"
sudo -u postgres psql -c "ALTER USER euro_lottery CREATEDB;" # Для тестов
```

### 3. Настройка Nginx

```bash
# Создаем конфигурацию сайта
sudo nano /etc/nginx/sites-available/euro_lottery.conf
```

Содержимое файла:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Перенаправление на HTTPS (будет добавлено Certbot)
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    # SSL сертификаты будут добавлены Certbot

    # Максимальный размер загружаемых файлов
    client_max_body_size 10M;

    # Frontend (React)
    location / {
        root /var/www/euro_lottery/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin panel
    location /admin {
        proxy_pass http://127.0.0.1:8000/admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files (Django)
    location /static/ {
        alias /var/www/euro_lottery/backend/staticfiles/;
    }

    # Media files
    location /media/ {
        alias /var/www/euro_lottery/backend/media/;
    }

    # API Documentation
    location /swagger {
        proxy_pass http://127.0.0.1:8000/swagger;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /redoc {
        proxy_pass http://127.0.0.1:8000/redoc;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Активация конфигурации:

```bash
sudo ln -s /etc/nginx/sites-available/euro_lottery.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Установка Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Развертывание приложения

### 1. Клонирование репозитория

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/yourusername/euro_lottery.git
cd euro_lottery
```

### 2. Настройка бэкенда

```bash
cd /var/www/euro_lottery/backend

# Создание и активация виртуального окружения
python3 -m venv venv
source venv/bin/activate

# Установка зависимостей
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn

# Создание .env файла
cp .env.example .env
nano .env
```

Отредактируйте .env файл, добавив актуальные значения:

```
# Django settings
DEBUG=False
SECRET_KEY=ваш_случайный_ключ
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com

# Database settings
DB_NAME=euro_lottery
DB_USER=euro_lottery
DB_PASSWORD=ваш_сложный_пароль
DB_HOST=localhost
DB_PORT=5432

# Email settings
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@your-domain.com

# Celery settings
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Payment providers
STRIPE_PUBLIC_KEY=your-live-stripe-public-key
STRIPE_SECRET_KEY=your-live-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-live-stripe-webhook-secret

PAYPAL_CLIENT_ID=your-live-paypal-client-id
PAYPAL_SECRET=your-live-paypal-secret
PAYPAL_MODE=live

# Security settings
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
```

Продолжаем настройку бэкенда:

```bash
# Применяем миграции
python manage.py migrate

# Создаем суперпользователя
python manage.py createsuperuser

# Собираем статические файлы
python manage.py collectstatic --no-input

# Создаем директорию для логов
mkdir -p logs
```

### 3. Настройка фронтенда

```bash
cd /var/www/euro_lottery/frontend

# Установка зависимостей
npm install

# Создание .env файла
cp .env.example .env
nano .env
```

Содержимое .env файла:

```
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_STRIPE_PUBLIC_KEY=your-live-stripe-public-key
REACT_APP_PAYPAL_CLIENT_ID=your-live-paypal-client-id
```

Сборка фронтенда:

```bash
npm run build
```

### 4. Настройка Supervisor для управления процессами

Создаем конфигурацию для Django:

```bash
sudo nano /etc/supervisor/conf.d/euro_lottery_backend.conf
```

Содержимое файла:

```
[program:euro_lottery_backend]
command=/var/www/euro_lottery/backend/venv/bin/gunicorn lottery_core.wsgi:application --bind 127.0.0.1:8000 --workers 3
directory=/var/www/euro_lottery/backend
user=www-data
group=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/www/euro_lottery/backend/logs/gunicorn.log
environment=DJANGO_SETTINGS_MODULE="lottery_core.settings"
```

Создаем конфигурацию для Celery worker:

```bash
sudo nano /etc/supervisor/conf.d/euro_lottery_celery.conf
```

Содержимое файла:

```
[program:euro_lottery_celery]
command=/var/www/euro_lottery/backend/venv/bin/celery -A lottery_core worker -l info
directory=/var/www/euro_lottery/backend
user=www-data
group=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/www/euro_lottery/backend/logs/celery.log
environment=DJANGO_SETTINGS_MODULE="lottery_core.settings"

[program:euro_lottery_celery_beat]
command=/var/www/euro_lottery/backend/venv/bin/celery -A lottery_core beat -l info
directory=/var/www/euro_lottery/backend
user=www-data
group=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/www/euro_lottery/backend/logs/celery_beat.log
environment=DJANGO_SETTINGS_MODULE="lottery_core.settings"
```

Обновляем и запускаем сервисы:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl status
```

### 5. Настройка прав доступа

```bash
# Устанавливаем владельца для директорий
sudo chown -R www-data:www-data /var/www/euro_lottery
sudo chmod -R 755 /var/www/euro_lottery

# Специальные права для логов и медиа
sudo chmod -R 775 /var/www/euro_lottery/backend/logs
sudo chmod -R 775 /var/www/euro_lottery/backend/media
```

## Настройка автоматических обновлений

### 1. Создание скрипта обновления

```bash
nano /var/www/euro_lottery/update.sh
```

Содержимое скрипта:

```bash
#!/bin/bash

# Перейти в директорию проекта
cd /var/www/euro_lottery

# Получить последние изменения
git pull

# Обновить бэкенд
cd /var/www/euro_lottery/backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --no-input

# Обновить фронтенд
cd /var/www/euro_lottery/frontend
npm install
npm run build

# Перезапустить сервисы
sudo supervisorctl restart euro_lottery_backend
sudo supervisorctl restart euro_lottery_celery
sudo supervisorctl restart euro_lottery_celery_beat

# Перезапустить Nginx
sudo systemctl restart nginx

echo "Обновление завершено $(date)"
```

Делаем скрипт исполняемым:

```bash
chmod +x /var/www/euro_lottery/update.sh
```

### 2. Настройка резервного копирования

```bash
nano /var/www/euro_lottery/backup.sh
```

Содержимое скрипта:

```bash
#!/bin/bash

# Настройка переменных
BACKUP_DIR="/var/backups/euro_lottery"
DATE=$(date +%Y-%m-%d-%H-%M)
DB_NAME="euro_lottery"
DB_USER="euro_lottery"
BACKUP_FILE="${BACKUP_DIR}/${DATE}-db-backup.sql"
MEDIA_BACKUP="${BACKUP_DIR}/${DATE}-media-backup.tar.gz"

# Создание директории для бэкапов
mkdir -p $BACKUP_DIR

# Бэкап базы данных
pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# Бэкап медиа файлов
tar -czf $MEDIA_BACKUP /var/www/euro_lottery/backend/media

# Удаление старых бэкапов (оставляем только последние 7 дней)
find $BACKUP_DIR -type f -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -type f -name "*.tar.gz" -mtime +7 -delete

echo "Резервное копирование завершено $(date)"
```

Делаем скрипт исполняемым и добавляем в cron:

```bash
chmod +x /var/www/euro_lottery/backup.sh
sudo crontab -e
```

Добавляем строки:

```
# Резервное копирование каждый день в 3:00
0 3 * * * /var/www/euro_lottery/backup.sh >> /var/log/euro_lottery_backup.log 2>&1
```

## Проверка работоспособности

1. Откройте в браузере https://your-domain.com
2. Проверьте доступность административной панели: https://your-domain.com/admin
3. Проверьте документацию API: https://your-domain.com/swagger
4. Проверьте работу webhook (через Stripe Dashboard)

## Мониторинг и логи

### Логи приложения
- Gunicorn: `/var/www/euro_lottery/backend/logs/gunicorn.log`
- Celery: `/var/www/euro_lottery/backend/logs/celery.log`
- Django: `/var/www/euro_lottery/backend/logs/euro_lottery.log`

### Логи системных сервисов
- Nginx: `/var/log/nginx/access.log` и `/var/log/nginx/error.log`
- Supervisor: `/var/log/supervisor/supervisord.log`

## Обновление

Для обновления приложения выполните:

```bash
sudo /var/www/euro_lottery/update.sh
```

## Устранение неполадок

### Проблемы с Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Проблемы с Supervisor
```bash
sudo supervisorctl status
sudo supervisorctl tail euro_lottery_backend
```

### Проблемы с базой данных
```bash
sudo -u postgres psql -c "\l"
sudo -u postgres psql -c "\du"
```

### Проблемы с правами доступа
```bash
sudo chmod -R 755 /var/www/euro_lottery
sudo chown -R www-data:www-data /var/www/euro_lottery
```