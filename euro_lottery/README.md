# Euro Lottery

Система онлайн-лотереи с бэкендом на Django и фронтендом на React.

## Возможности

- Управление лотереями и розыгрышами
- Покупка билетов и участие в розыгрышах
- Система аутентификации пользователей
- Платежная система (интеграция с Stripe и PayPal)
- Просмотр истории транзакций и билетов
- Уведомления о выигрышах
- Административная панель для управления системой

## Технологии

### Бэкенд
- Python 3.9+
- Django 4.2
- Django REST Framework
- JWT аутентификация (djangorestframework-simplejwt)
- Celery для фоновых задач
- PostgreSQL в продакшене (SQLite для разработки)
- Покрытие тестами (pytest)

### Фронтенд
- React 18
- Redux Toolkit для управления состоянием
- React Router для навигации
- Bootstrap 5 для стилизации
- Jest для тестирования
- ESLint для линтинга кода

## Начало работы

### Требования
- Python 3.9+
- Node.js 16+
- PostgreSQL (для продакшена)
- Redis (для Celery)

### Настройка окружения для разработки

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/euro_lottery.git
cd euro_lottery
```

2. Настройте бэкенд:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # На Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Создайте файл `.env` в директории `backend/` на основе `.env.example`

4. Настройте базу данных и запустите миграции:
```bash
python manage.py migrate
python manage.py createsuperuser
```

5. Настройте фронтенд:
```bash
cd ../frontend
npm install
```

6. Создайте файл `.env` в директории `frontend/` на основе `.env.example`

### Запуск для разработки

1. Запустите бэкенд:
```bash
cd backend
source venv/bin/activate  # На Windows: venv\Scripts\activate
python manage.py runserver
```

2. Запустите Celery (в отдельном терминале):
```bash
cd backend
source venv/bin/activate  # На Windows: venv\Scripts\activate
celery -A lottery_core worker -l INFO
```

3. Запустите Celery Beat (в отдельном терминале):
```bash
cd backend
source venv/bin/activate  # На Windows: venv\Scripts\activate
celery -A lottery_core beat -l INFO
```

4. Запустите фронтенд (в отдельном терминале):
```bash
cd frontend
npm start
```

### Запуск тестов

#### Бэкенд
```bash
cd backend
pytest
pytest --cov=.
```

#### Фронтенд
```bash
cd frontend
npm test
npm run test:coverage
```

### Линтинг кода

#### Бэкенд
```bash
cd backend
flake8
black .
isort .
```

#### Фронтенд
```bash
cd frontend
npm run lint
npm run lint:fix
npm run format
```

## Настройка проекта для продакшена

### Бэкенд (Django)

1. Настройте PostgreSQL базу данных:

```bash
# Создайте пользователя и базу данных
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE euro_lottery OWNER postgres;"
```

2. Обновите файл `.env` в директории `backend/`:

```
# Замените домен на свой
ALLOWED_HOSTS=your-production-domain.com
CORS_ALLOWED_ORIGINS=https://your-production-domain.com

# Укажите доступы к базе данных
DB_NAME=euro_lottery
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# Настройки email
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# API ключи платежных систем
STRIPE_PUBLIC_KEY=your-stripe-public-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret
```

3. Запустите скрипт настройки:

```bash
cd backend
./setup.sh
```

### Фронтенд (React)

1. Обновите файл `.env` в директории `frontend/`:

```
REACT_APP_API_URL=https://your-production-domain.com/api
REACT_APP_STRIPE_PUBLIC_KEY=your-stripe-public-key
```

2. Соберите проект для продакшена:

```bash
cd frontend
./scripts/build_production.sh
```

3. Разместите содержимое директории `build/` на веб-сервере (например, Nginx или Apache).

### Настройка веб-сервера (Nginx пример)

```
server {
    listen 80;
    server_name your-production-domain.com;
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /admin {
        proxy_pass http://localhost:8000/admin;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /static/admin {
        proxy_pass http://localhost:8000/static/admin;
    }
    
    location / {
        root /path/to/euro_lottery/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

### Настройка SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d your-production-domain.com
```

### API документация

API документация доступна по следующим URL:
- Swagger UI: `http://localhost:8000/swagger/`
- ReDoc: `http://localhost:8000/redoc/`
- OpenAPI JSON: `http://localhost:8000/swagger.json`

## Структура проекта

### Бэкенд

- `lottery_core/` - основной проект Django
  - `settings.py` - настройки проекта
  - `urls.py` - URL маршруты
  - `celery.py` - настройки Celery
- `lottery/` - приложение для управления лотереями и билетами
- `payments/` - приложение для управления платежами
- `users/` - приложение для управления пользователями

### Фронтенд

- `src/` - исходный код React приложения
  - `components/` - переиспользуемые компоненты
  - `layouts/` - шаблоны страниц
  - `pages/` - страницы приложения
  - `store/` - Redux store и slices
  - `utils/` - вспомогательные функции

## Лицензия

Этот проект находится под лицензией [MIT](LICENSE).