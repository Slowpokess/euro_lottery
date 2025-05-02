import datetime
from django.conf import settings

def site_settings(request):
    """
    Custom context processor to add common site settings to all templates
    """
    return {
        'site_name': getattr(settings, 'SITE_NAME', 'Euro Lottery'),
        'site_url': getattr(settings, 'SITE_URL', 'https://eurolottery.example.com'),
        'current_year': datetime.datetime.now().year,
        'support_email': getattr(settings, 'DEFAULT_FROM_EMAIL', 'support@eurolottery.com'),
    }