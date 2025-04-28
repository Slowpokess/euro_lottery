#!/bin/bash

# Скрипт для деплоя исправлений CORS и прокси-конфигурации

echo "=== Деплой исправлений CORS и прокси-конфигурации ==="
echo "Этот скрипт добавит и закоммитит измененные файлы для деплоя на Railway и Vercel"

# Проверка наличия изменений
git status

echo ""
echo "=== Добавление файлов в коммит ==="

# 1. Добавить серверные файлы для деплоя на Railway
git add server/app.js
echo "Добавлен server/app.js"

# 2. Добавить файлы клиента для деплоя на Vercel
git add vercel.json .env.production
echo "Добавлены vercel.json и .env.production"

echo ""
echo "=== Создание коммита ==="
git commit -m "Исправление CORS: добавлено прокси API между Vercel и Railway"
echo "Коммит создан"

echo ""
echo "=== Отправка изменений на GitHub ==="
git push origin main
echo "Изменения отправлены на GitHub"

echo ""
echo "=== Дальнейшие шаги ==="
echo "1. Перейдите на сайт Railway (https://railway.app/dashboard) и проверьте статус деплоя бэкенда"
echo "2. Перейдите на сайт Vercel (https://vercel.com/dashboard) и проверьте статус деплоя фронтенда"
echo "3. После успешного деплоя проверьте работу сайта на Vercel, особенно страницы:"
echo "   - Пространство"
echo "   - Резиденты"
echo "   - События"
echo "4. Проверьте консоль браузера на наличие ошибок CORS"

echo ""
echo "=== Завершено ==="