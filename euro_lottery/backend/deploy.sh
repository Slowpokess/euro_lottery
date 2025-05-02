#!/bin/bash
set -e  # Exit on error

# Activate virtual environment 
source venv/bin/activate

# Install or update dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Clear cache
python manage.py shell << EOF
from django.core.cache import cache
cache.clear()
EOF

# Restart Celery workers via systemd
# systemctl restart celery
# systemctl restart celerybeat

echo "Deployment completed successfully!"