#!/bin/bash

# Создаем виртуальное окружение
python3 -m venv venv

# Активируем виртуальное окружение
source venv/bin/activate

# Устанавливаем зависимости
pip install -r requirements.txt

# Создаем миграции и применяем их
python manage.py collectstatic --noinput
python manage.py migrate

# Создаем суперпользователя (при необходимости)
# echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')" | python manage.py shell

# Запускаем сервер
gunicorn lottery_core.wsgi