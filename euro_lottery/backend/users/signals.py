from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken, OutstandingToken
from .models import UserActivity

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_activity_for_new_users(sender, instance, created, **kwargs):
    """
    Создает запись активности для новых пользователей
    """
    if created:
        UserActivity.objects.create(
            user=instance,
            activity_type='account_created',
            ip_address='0.0.0.0',  # IP неизвестен при создании через сигнал
            user_agent='System',
            details={
                'username': instance.username,
                'email': instance.email,
                'is_verified': instance.is_verified
            }
        )


@receiver(post_save, sender=OutstandingToken)
def track_token_creation(sender, instance, created, **kwargs):
    """
    Отслеживает создание новых токенов для лучшего мониторинга безопасности
    """
    if created and instance.user:
        # Регистрируем только создание токенов для реальных пользователей
        UserActivity.objects.create(
            user=instance.user,
            activity_type='token_created',
            ip_address='0.0.0.0',  # IP неизвестен при создании через сигнал
            user_agent='System',
            details={
                'token_id': instance.id,
                'token_type': 'refresh',
                'expires_at': str(instance.expires_at) if instance.expires_at else None,
                'jti': instance.jti
            }
        )