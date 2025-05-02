#!/bin/bash

# Установка зависимостей
npm install

# Сборка проекта для продакшена
npm run build

# Создаем .htaccess файл для Apache (опционально)
echo 'Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]' > build/.htaccess

echo "Frontend built successfully for production!"