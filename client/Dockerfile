FROM nginx:stable-alpine

# Копируем предварительно собранные статические файлы
COPY build/ /usr/share/nginx/html/

# Копируем конфигурацию NGINX
COPY nginx.conf.railway /etc/nginx/conf.d/default.conf

# Expose порт
EXPOSE 80

# Запуск NGINX
CMD ["nginx", "-g", "daemon off;"]