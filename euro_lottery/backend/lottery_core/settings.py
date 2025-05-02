import os
from pathlib import Path
from dotenv import load_dotenv

# Загрузка переменных окружения из .env файла
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-for-development')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',  # For JWT token blacklisting
    'corsheaders',
    'django_celery_beat',
    'drf_yasg',
    
    # Local apps
    'users',
    'lottery',
    'payments',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS middleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'lottery_core.middleware.RequestMiddleware',  # Add request to thread local for logging
]

ROOT_URLCONF = 'lottery_core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                # Custom context processors
                'lottery_core.context_processors.site_settings',
            ],
        },
    },
]

WSGI_APPLICATION = 'lottery_core.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

# Для разработки используем SQLite, для продакшена - PostgreSQL
if DEBUG:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.getenv('DB_NAME', 'euro_lottery'),
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': os.getenv('DB_PORT', '5432'),
        }
    }

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Пользовательская модель для аутентификации
AUTH_USER_MODEL = 'users.User'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# CORS settings
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',')
CORS_ALLOW_CREDENTIALS = True

# JWT settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),  # Shorter lifetime for better security
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # Longer refresh period for user convenience
    'ROTATE_REFRESH_TOKENS': True,                   # Enable token rotation for better security
    'BLACKLIST_AFTER_ROTATION': True,                # Blacklist old tokens
    'UPDATE_LAST_LOGIN': True,                       # Track login times
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'JTI_CLAIM': 'jti',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
}

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@eurolottery.com')

# Site settings
SITE_NAME = 'Euro Lottery'
SITE_URL = os.getenv('SITE_URL', 'https://eurolottery.example.com')
SUPPORT_EMAIL = os.getenv('SUPPORT_EMAIL', 'support@eurolottery.com')

# Настройки для лотереи
LOTTERY_SETTINGS = {
    'DRAW_BUFFER_TIME': int(os.getenv('DRAW_BUFFER_TIME', 60)),  # минуты до начала розыгрыша, когда билеты больше не продаются
    'MAX_TICKETS_PER_USER': int(os.getenv('MAX_TICKETS_PER_USER', 10)),  # максимальное количество билетов на один розыгрыш
}

# Настройки для сертифицированного генератора случайных чисел
RNG_SETTINGS = {
    'PROVIDER': os.getenv('RNG_PROVIDER', 'internal'),  # 'internal' или 'external'
    'API_KEY': os.getenv('RNG_API_KEY', ''),
    'API_URL': os.getenv('RNG_API_URL', ''),
}

# Платежные системы
PAYMENT_PROVIDERS = {
    'STRIPE': {
        'PUBLIC_KEY': os.getenv('STRIPE_PUBLIC_KEY', ''),
        'SECRET_KEY': os.getenv('STRIPE_SECRET_KEY', ''),
        'WEBHOOK_SECRET': os.getenv('STRIPE_WEBHOOK_SECRET', ''),
    },
    'PAYPAL': {
        'CLIENT_ID': os.getenv('PAYPAL_CLIENT_ID', ''),
        'SECRET': os.getenv('PAYPAL_SECRET', ''),
        'MODE': os.getenv('PAYPAL_MODE', 'sandbox'),  # 'sandbox' или 'live'
    },
    'CRYPTO': {
        'PUBLIC_KEY': os.getenv('COINPAYMENTS_PUBLIC_KEY', ''),
        'PRIVATE_KEY': os.getenv('COINPAYMENTS_PRIVATE_KEY', ''),
        'MERCHANT_ID': os.getenv('COINPAYMENTS_MERCHANT_ID', ''),
        'IPN_SECRET': os.getenv('COINPAYMENTS_IPN_SECRET', ''),
    },
}

# Настройки платежных процессоров
STRIPE_PUBLIC_KEY = os.getenv('STRIPE_PUBLIC_KEY', '')
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')

PAYPAL_CLIENT_ID = os.getenv('PAYPAL_CLIENT_ID', '')
PAYPAL_SECRET = os.getenv('PAYPAL_SECRET', '')
PAYPAL_MODE = os.getenv('PAYPAL_MODE', 'sandbox')

COINPAYMENTS_PUBLIC_KEY = os.getenv('COINPAYMENTS_PUBLIC_KEY', '')
COINPAYMENTS_PRIVATE_KEY = os.getenv('COINPAYMENTS_PRIVATE_KEY', '')
COINPAYMENTS_MERCHANT_ID = os.getenv('COINPAYMENTS_MERCHANT_ID', '')
COINPAYMENTS_IPN_SECRET = os.getenv('COINPAYMENTS_IPN_SECRET', '')

# Настройки платежей по умолчанию
DEFAULT_PAYMENT_PROVIDER = os.getenv('DEFAULT_PAYMENT_PROVIDER', 'stripe')
DEFAULT_CURRENCY = os.getenv('DEFAULT_CURRENCY', 'USD')
DEFAULT_CRYPTO = os.getenv('DEFAULT_CRYPTO', 'BTC')

# Настройки безопасности
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'False') == 'True'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'False') == 'True'
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'False') == 'True'
SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', 0))
SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv('SECURE_HSTS_INCLUDE_SUBDOMAINS', 'False') == 'True'
SECURE_HSTS_PRELOAD = os.getenv('SECURE_HSTS_PRELOAD', 'False') == 'True'

# Защита от DDoS-атак (при использовании cloudflare или аналогичных сервисов)
CLOUDFLARE_API_TOKEN = os.getenv('CLOUDFLARE_API_TOKEN', '')

# Celery settings
# В режиме разработки используем memory, в продакшне - Redis
if DEBUG:
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'memory://')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'cache')
    CELERY_CACHE_BACKEND = 'django-cache'
    CELERY_TASK_ALWAYS_EAGER = True  # Выполнять задачи немедленно (без воркера)
else:
    # Для продакшн среды используем Redis
    REDIS_HOST = os.getenv('REDIS_HOST', 'localhost')
    REDIS_PORT = os.getenv('REDIS_PORT', '6379')
    REDIS_DB = os.getenv('REDIS_DB', '0')
    REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', '')
    
    if REDIS_PASSWORD:
        CELERY_BROKER_URL = f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}'
        CELERY_RESULT_BACKEND = f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}'
    else:
        CELERY_BROKER_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}'
        CELERY_RESULT_BACKEND = f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}'
    
    CELERY_TASK_ALWAYS_EAGER = False  # В продакшне используем асинхронное выполнение

# Общие настройки Celery
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

# Настройки для автоматического перезапуска задач при ошибках
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_TASK_TRACK_STARTED = True

# Celery Beat schedule
CELERY_BEAT_SCHEDULE = {
    # Задачи для лотереи
    'conduct-pending-draws': {
        'task': 'lottery.tasks.conduct_pending_draws',
        'schedule': 60.0 * 5,  # Каждые 5 минут
    },
    'schedule-next-draws': {
        'task': 'lottery.tasks.schedule_next_draws',
        'schedule': 60.0 * 60 * 12,  # Каждые 12 часов
    },
    'verify-draw-results': {
        'task': 'lottery.tasks.verify_completed_draws',
        'schedule': 60.0 * 30,  # Каждые 30 минут
    },
    'check-ticket-winnings': {
        'task': 'lottery.tasks.check_ticket_winnings',
        'schedule': 60.0 * 15,  # Каждые 15 минут
    },
    
    # Задачи для платежей
    'process-pending-payouts': {
        'task': 'payments.tasks.process_pending_payouts',
        'schedule': 60.0 * 60,  # Каждый час
    },
    'check-pending-deposits': {
        'task': 'payments.tasks.check_pending_deposits',
        'schedule': 60.0 * 10,  # Каждые 10 минут
    },
    'retry-failed-deposits': {
        'task': 'payments.tasks.retry_failed_deposits',
        'schedule': 60.0 * 60 * 3,  # Каждые 3 часа
    },
    
    # Задачи для уведомлений
    'send-pending-notifications': {
        'task': 'users.tasks.send_pending_notifications',
        'schedule': 60.0 * 2,  # Каждые 2 минуты
    },
    'send-upcoming-draw-reminders': {
        'task': 'users.tasks.send_upcoming_draw_reminders',
        'schedule': 60.0 * 60 * 6,  # Каждые 6 часов
    },
    'clean-old-notifications': {
        'task': 'users.tasks.clean_old_notifications',
        'schedule': 60.0 * 60 * 24,  # Ежедневно
    },
}

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(timestamp)s %(level)s %(name)s %(message)s %(pathname)s %(lineno)d %(funcName)s %(process)d %(thread)d %(request_id)s %(user_id)s %(ip)s',
            'rename_fields': {
                'levelname': 'level',
                'asctime': 'timestamp',
            },
        },
        'structured': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '%(timestamp)s %(level)s %(name)s %(message)s',
            'rename_fields': {
                'levelname': 'level',
                'asctime': 'timestamp',
            },
        },
    },
    'filters': {
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'add_request_id': {
            '()': 'lottery_core.logging_filters.RequestIDFilter',
        },
        'add_user_info': {
            '()': 'lottery_core.logging_filters.UserInfoFilter',
        },
    },
    'handlers': {
        'console': {
            'level': os.getenv('CONSOLE_LOG_LEVEL', 'INFO'),
            'class': 'logging.StreamHandler',
            'formatter': 'json',
            'filters': ['add_request_id', 'add_user_info'],
        },
        'file': {
            'level': os.getenv('FILE_LOG_LEVEL', 'INFO'),
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/euro_lottery.log'),
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'json',
            'filters': ['add_request_id', 'add_user_info'],
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/error.log'),
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'json',
            'filters': ['add_request_id', 'add_user_info'],
        },
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler',
            'filters': ['require_debug_false'],
        },
        'security': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs/security.log'),
            'maxBytes': 10485760,  # 10MB
            'backupCount': 10,
            'formatter': 'json',
            'filters': ['add_request_id', 'add_user_info'],
        },
    },
    'root': {
        'handlers': ['console', 'file', 'error_file'],
        'level': os.getenv('ROOT_LOG_LEVEL', 'INFO'),
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'propagate': True,
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
        },
        'django.request': {
            'handlers': ['mail_admins', 'error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.server': {
            'handlers': ['console', 'file'],
            'level': os.getenv('DJANGO_SERVER_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console', 'file'],
            'level': os.getenv('DJANGO_DB_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'django.security': {
            'handlers': ['security', 'mail_admins'],
            'level': 'INFO',
            'propagate': False,
        },
        'lottery': {
            'handlers': ['console', 'file', 'error_file'],
            'level': os.getenv('APP_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'payments': {
            'handlers': ['console', 'file', 'error_file'],
            'level': os.getenv('APP_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'users': {
            'handlers': ['console', 'file', 'error_file'],
            'level': os.getenv('APP_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
        'celery': {
            'handlers': ['console', 'file', 'error_file'],
            'level': os.getenv('CELERY_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)