# Инструкция по деплою на Railway

## Подготовка

1. Создайте аккаунт на [Railway](https://railway.app/)
2. Установите CLI Railway:
   ```
   npm i -g @railway/cli
   ```
3. Войдите в аккаунт:
   ```
   railway login
   ```

## Деплой бэкенда

1. Перейдите в директорию сервера:
   ```
   cd server
   ```

2. Инициализируйте проект в Rarailway:
   ```
   railway init
   ```

3. Разверните проект:
   ```
   railway up
   ```

4. Настройте переменные окружения:
   ```
   railway variables set --from-file .env.railway
   ```

5. Получите URL бэкенда:
   ```
   railway status
   ```
   Сохраните полученный URL - он понадобится для фронтенда.

## Деплой фронтенда

1. Вернитесь в корневую директорию проекта:
   ```
   cd ..
   ```

2. Обновите .env.railway, заменив `your-railway-backend-url.railway.app` на реальный URL бэкенда.

3. Инициализируйте проект в Railway:
   ```
   railway init
   ```

4. Разверните проект:
   ```
   railway up
   ```

5. Настройте переменные окружения:
   ```
   railway variables set --from-file .env.railway
   ```

6. Получите URL фронтенда:
   ```
   railway status
   ```
   
7. Обновите переменную CORS_ORIGIN в бэкенде, заменив текущее значение на URL фронтенда:
   ```
   cd server
   railway variables set CORS_ORIGIN=https://your-railway-frontend-url.railway.app
   ```

## Мониторинг и управление

- Откройте дашборд Railway в браузере:
  ```
  railway open
  ```

- Просмотр логов:
  ```
  railway logs
  ```

## Примечания

- Railway автоматически обнаружит Dockerfile или package.json для сборки
- База данных MongoDB остается на Atlas (внешний сервис)
- Uploads хранятся в Railway's storage (ephemeral)
- Для постоянного хранения файлов рекомендуется настроить S3-совместимое хранилище