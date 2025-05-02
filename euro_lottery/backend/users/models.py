from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone


class User(AbstractUser):
    """Расширенная модель пользователя для лотерейной системы"""
    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    verification_token = models.CharField(max_length=100, blank=True, null=True)
    
    # Двухфакторная аутентификация
    is_2fa_enabled = models.BooleanField(default=False)
    
    # Баланс пользователя
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Настройки уведомлений
    email_notifications = models.BooleanField(default=True)
    sms_notifications = models.BooleanField(default=False)
    push_notifications = models.BooleanField(default=True)
    
    # Ответственная игра
    daily_limit = models.DecimalField(max_digits=12, decimal_places=2, default=100.00)
    weekly_limit = models.DecimalField(max_digits=12, decimal_places=2, default=500.00)
    monthly_limit = models.DecimalField(max_digits=12, decimal_places=2, default=2000.00)
    is_self_excluded = models.BooleanField(default=False)
    self_exclusion_end_date = models.DateField(null=True, blank=True)
    
    # KYC статус
    KYC_STATUS_CHOICES = [
        ('not_started', 'Not Started'),
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    kyc_status = models.CharField(max_length=20, choices=KYC_STATUS_CHOICES, default='not_started')
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email


class UserDocument(models.Model):
    """Документы пользователя для KYC верификации"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    
    DOCUMENT_TYPE_CHOICES = [
        ('id_card', 'ID Card'),
        ('passport', 'Passport'),
        ('driving_license', 'Driving License'),
        ('utility_bill', 'Utility Bill'),
        ('bank_statement', 'Bank Statement'),
    ]
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPE_CHOICES)
    document_file = models.FileField(upload_to='user_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.email} - {self.document_type}"


class UserActivity(models.Model):
    """Лог активности пользователя для безопасности и аудита"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(default=dict)
    
    def __str__(self):
        return f"{self.user.email} - {self.activity_type} - {self.created_at}"


class ReferralCode(models.Model):
    """Реферальная система"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referral_code')
    code = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.code}"


class Referral(models.Model):
    """Модель для отслеживания реферальных регистраций"""
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referrals')
    referred_user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='referred_by')
    created_at = models.DateTimeField(auto_now_add=True)
    bonus_paid = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.referrer.email} referred {self.referred_user.email}"


class Notification(models.Model):
    """Модель для управления уведомлениями пользователей"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    
    NOTIFICATION_TYPE_CHOICES = [
        ('welcome', 'Welcome'),
        ('draw_upcoming', 'Upcoming Draw'),
        ('draw_results', 'Draw Results'),
        ('winning', 'Winning Notification'),
        ('deposit_success', 'Deposit Successful'),
        ('deposit_failed', 'Deposit Failed'),
        ('withdrawal_approved', 'Withdrawal Approved'),
        ('withdrawal_processed', 'Withdrawal Processed'),
        ('withdrawal_failed', 'Withdrawal Failed'),
        ('ticket_purchased', 'Ticket Purchased'),
        ('promo', 'Promotional'),
        ('system', 'System Notification'),
    ]
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPE_CHOICES)
    
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Статус уведомления
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Каналы доставки уведомления
    is_email_sent = models.BooleanField(default=False)
    is_sms_sent = models.BooleanField(default=False)
    is_push_sent = models.BooleanField(default=False)
    
    # Связи с другими моделями
    related_object_id = models.IntegerField(null=True, blank=True)
    related_object_type = models.CharField(max_length=50, null=True, blank=True)
    
    # Приоритет уведомления
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    
    # Данные для включения в уведомление
    data = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.notification_type} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def mark_as_read(self):
        """Пометить уведомление как прочитанное"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
    
    def mark_as_unread(self):
        """Пометить уведомление как непрочитанное"""
        self.is_read = False
        self.read_at = None
        self.save()