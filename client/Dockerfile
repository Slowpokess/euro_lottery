# Многоэтапная сборка для решения проблем с зависимостями
# Этап 1: Установка зависимостей в отдельном слое
FROM node:16-alpine AS deps

WORKDIR /app

# Копируем только файлы зависимостей для кэширования слоев Docker
COPY package.json package-lock.json .npmrc ./

# Устанавливаем зависимости с пропуском проверки peer dependencies
RUN npm ci --legacy-peer-deps --quiet

# Этап 2: Патчим проблемные модули и собираем приложение
FROM node:16-alpine AS builder

WORKDIR /app

# Копируем установленные зависимости
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Создаем временный файл для патча ajv-keywords
RUN echo 'const codegen = require("ajv/dist/compile/codegen");module.exports = codegen;' > /tmp/codegen.js

# Добавляем недостающий модуль
RUN mkdir -p /app/node_modules/ajv/dist/compile/
RUN cp /tmp/codegen.js /app/node_modules/ajv/dist/compile/codegen.js

# Исправляем пути импорта в проблемном файле
RUN sed -i 's/ajv\/dist\/compile\/codegen/\.\.\/\.\.\/\.\.\/codegen/' /app/node_modules/ajv-keywords/dist/definitions/typeof.js || true

# Выполняем сборку с исправленными зависимостями
RUN npm run build

# Этап 3: Финальный образ только с NGINX и собранными файлами
FROM nginx:alpine

# Копируем собранные файлы из этапа builder
COPY --from=builder /app/build /usr/share/nginx/html

# Копируем конфигурацию NGINX
COPY nginx.conf.railway /etc/nginx/conf.d/default.conf

# Экспортируем порт
EXPOSE 80

# Запускаем NGINX
CMD ["nginx", "-g", "daemon off;"]