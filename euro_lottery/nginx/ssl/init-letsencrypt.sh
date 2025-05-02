#!/bin/bash
set -e

# Параметры
domains=(eurolottery.com www.eurolottery.com)
email="admin@eurolottery.com"  # Укажите реальный email для уведомлений Let's Encrypt
staging=0 # Установите 1 для тестирования (не создает настоящие сертификаты)
data_path="/etc/letsencrypt"
nginx_container_name="euro_lottery_nginx_1" # Имя контейнера Nginx может отличаться

# Создадим требуемые директории
mkdir -p "$data_path/conf/live/$domains"
mkdir -p "$data_path/www"

# Создаем фиктивные сертификаты, если их еще нет 
if [ ! -e "$data_path/conf/live/$domains/cert.pem" ]; then
  echo "### Создание фиктивных сертификатов для $domains ..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$data_path/conf/live/$domains/privkey.pem" \
    -out "$data_path/conf/live/$domains/fullchain.pem" \
    -subj "/CN=localhost"
  
  echo "### Созданы фиктивные сертификаты."
fi

echo "### Запуск docker-compose ..."
docker-compose up -d nginx

echo "### Ожидание запуска Nginx ..."
sleep 5

echo "### Запрос Let's Encrypt сертификатов ..."

# Выбор режима: staging или production
if [ $staging -eq 1 ]; then
  staging_arg="--staging"
else
  staging_arg=""
fi

# Запрос сертификатов
docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/letsencrypt \
    $staging_arg \
    --email $email \
    --agree-tos \
    --no-eff-email \
    -d ${domains[0]} -d ${domains[1]}" certbot

echo "### Перезапуск Nginx ..."
docker-compose exec nginx nginx -s reload

echo "### Настройка автоматического обновления сертификатов ..."
cat > ./renew-certs.sh <<EOF
#!/bin/bash
set -e

docker-compose run --rm --entrypoint "\
  certbot renew \
    --webroot -w /var/www/letsencrypt \
    --quiet \
    --no-self-upgrade" certbot

docker-compose exec nginx nginx -s reload
EOF

chmod +x ./renew-certs.sh

echo "### Создаем crontab задание для обновления (запускается дважды в день) ..."
(crontab -l 2>/dev/null || true; echo "0 3,15 * * * cd $(pwd) && ./renew-certs.sh >> /var/log/letsencrypt-renew.log 2>&1") | crontab -

echo "### Готово! Ваши сертификаты были настроены и будут автоматически обновляться."
echo "### Проверьте журналы certbot для подтверждения."
echo "### Примечание: если вы используете режим staging (staging=1), сертификаты не будут доверенными."
echo "### После успешного тестирования измените staging=0 и запустите скрипт снова."