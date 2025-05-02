from django.db import models
from django.conf import settings
import uuid


class Transaction(models.Model):
    """Модель для всех финансовых транзакций"""
    transaction_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    
    TRANSACTION_TYPE_CHOICES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('ticket_purchase', 'Ticket Purchase'),
        ('winning', 'Winning'),
        ('refund', 'Refund'),
        ('bonus', 'Bonus'),
    ]
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    balance_before = models.DecimalField(max_digits=12, decimal_places=2)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Связи с другими моделями
    related_ticket = models.ForeignKey('lottery.Ticket', on_delete=models.SET_NULL, 
                                       null=True, blank=True, related_name='transactions')
    related_winning = models.ForeignKey('lottery.WinningTicket', on_delete=models.SET_NULL,
                                        null=True, blank=True, related_name='transactions')
    payment_method = models.ForeignKey('PaymentMethod', on_delete=models.SET_NULL, 
                                       null=True, blank=True, related_name='transactions')
    
    # Дополнительная информация
    description = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    def __str__(self):
        return f"{self.transaction_id} - {self.user.email} - {self.transaction_type} - {self.amount}"
    
    class Meta:
        ordering = ['-created_at']


class PaymentMethod(models.Model):
    """Модель для сохраненных методов оплаты пользователя"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payment_methods')
    
    METHOD_TYPE_CHOICES = [
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('bank_account', 'Bank Account'),
        ('e_wallet', 'E-Wallet'),
        ('crypto_wallet', 'Cryptocurrency Wallet'),
    ]
    method_type = models.CharField(max_length=20, choices=METHOD_TYPE_CHOICES)
    
    # Для карт
    card_last_four = models.CharField(max_length=4, null=True, blank=True)
    card_expiry_month = models.CharField(max_length=2, null=True, blank=True)
    card_expiry_year = models.CharField(max_length=4, null=True, blank=True)
    card_brand = models.CharField(max_length=20, null=True, blank=True)
    
    # Для банковского счета
    bank_name = models.CharField(max_length=100, null=True, blank=True)
    account_last_four = models.CharField(max_length=4, null=True, blank=True)
    
    # Для электронных кошельков
    e_wallet_provider = models.CharField(max_length=50, null=True, blank=True)
    e_wallet_email = models.EmailField(null=True, blank=True)
    
    # Для криптовалютных кошельков
    crypto_currency = models.CharField(max_length=10, null=True, blank=True)  # BTC, ETH, USDT, etc.
    crypto_address = models.CharField(max_length=100, null=True, blank=True)  # Адрес кошелька
    crypto_network = models.CharField(max_length=20, null=True, blank=True)  # Сеть (BTC, ETH, BSC, etc.)
    crypto_memo = models.CharField(max_length=100, null=True, blank=True)  # Дополнительный идентификатор для некоторых валют
    
    # Общие поля
    is_default = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    nickname = models.CharField(max_length=50, null=True, blank=True)
    
    # Токен для платежного провайдера
    provider_token = models.CharField(max_length=255, null=True, blank=True)
    provider_id = models.CharField(max_length=255, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        if self.method_type in ['credit_card', 'debit_card'] and self.card_last_four:
            return f"{self.method_type} - {self.card_brand} ****{self.card_last_four}"
        elif self.method_type == 'bank_account' and self.bank_name:
            return f"{self.bank_name} - ****{self.account_last_four}"
        elif self.method_type == 'e_wallet' and self.e_wallet_provider:
            return f"{self.e_wallet_provider} - {self.e_wallet_email}"
        elif self.method_type == 'crypto_wallet' and self.crypto_address:
            # Сокращаем адрес для удобства отображения
            addr_short = f"{self.crypto_address[:6]}...{self.crypto_address[-4:]}"
            return f"{self.crypto_currency} - {addr_short}"
        else:
            return f"{self.method_type} - {self.created_at}"


class PaymentProvider(models.Model):
    """Модель для интеграции с платежными провайдерами"""
    name = models.CharField(max_length=100)
    provider_type = models.CharField(max_length=50)
    
    is_active = models.BooleanField(default=True)
    
    # Конфигурация для интеграции
    config = models.JSONField(default=dict)
    
    # Поддерживаемые валюты
    supported_currencies = models.JSONField(default=list)
    
    # Ограничения
    min_deposit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_deposit = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    min_withdrawal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    max_withdrawal = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Комиссии
    deposit_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    deposit_fee_fixed = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    withdrawal_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    withdrawal_fee_fixed = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name


class WithdrawalRequest(models.Model):
    """Модель для запросов на вывод средств"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='withdrawal_requests')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.CASCADE)
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, 
                                       null=True, blank=True, related_name='withdrawal_request')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    # Информация об отклонении
    rejection_reason = models.TextField(null=True, blank=True)
    
    # Аудит
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, 
                                     null=True, blank=True, related_name='processed_withdrawals')
    
    def __str__(self):
        return f"{self.user.email} - {self.amount} - {self.status}"


class DepositTransaction(models.Model):
    """Модель для отслеживания депозитов"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='deposits')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_provider = models.ForeignKey(PaymentProvider, on_delete=models.CASCADE)
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Внешние идентификаторы и статусы
    provider_transaction_id = models.CharField(max_length=255, null=True, blank=True)
    provider_status = models.CharField(max_length=50, null=True, blank=True)
    
    # Связь с основной транзакцией
    transaction = models.OneToOneField(Transaction, on_delete=models.CASCADE, related_name='deposit')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Дополнительные данные от платежного провайдера
    provider_response = models.JSONField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.email} - {self.amount} - {self.transaction.status}"