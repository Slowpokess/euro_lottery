#!/bin/bash

# Создаем виртуальное окружение, если оно не существует
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Активируем виртуальное окружение
source venv/bin/activate

# Устанавливаем зависимости
echo "Installing dependencies..."
pip install -r requirements.txt

# Применяем миграции
echo "Applying migrations..."
python manage.py migrate

# Создаем суперпользователя, если нужно
if [ "$1" == "--create-admin" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser
fi

# Собираем статические файлы
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Запускаем сервер разработки
echo "Starting development server..."
python manage.py runserver