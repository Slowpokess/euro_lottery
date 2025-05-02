from rest_framework import serializers
from .models import (
    Transaction, PaymentMethod, PaymentProvider, 
    WithdrawalRequest, DepositTransaction
)


class TransactionSerializer(serializers.ModelSerializer):
    """Сериализатор для транзакций"""
    class Meta:
        model = Transaction
        fields = ('id', 'transaction_id', 'user', 'transaction_type', 'amount',
                  'balance_before', 'balance_after', 'status', 'created_at',
                  'updated_at', 'related_ticket', 'related_winning',
                  'payment_method', 'description', 'metadata')
        read_only_fields = fields


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Сериализатор для методов оплаты"""
    class Meta:
        model = PaymentMethod
        fields = ('id', 'user', 'method_type', 'card_last_four', 'card_expiry_month',
                  'card_expiry_year', 'card_brand', 'bank_name', 'account_last_four',
                  'e_wallet_provider', 'e_wallet_email', 'crypto_currency', 'crypto_address',
                  'crypto_network', 'crypto_memo', 'is_default', 'is_verified',
                  'nickname', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user', 'is_verified', 'created_at', 'updated_at')


class AddCreditCardSerializer(serializers.Serializer):
    """Сериализатор для добавления кредитной карты"""
    card_token = serializers.CharField(required=True)
    is_default = serializers.BooleanField(default=False)
    nickname = serializers.CharField(required=False, allow_blank=True)


class AddBankAccountSerializer(serializers.Serializer):
    """Сериализатор для добавления банковского счета"""
    bank_name = serializers.CharField(required=True)
    account_number = serializers.CharField(required=True)
    routing_number = serializers.CharField(required=True)
    account_holder_name = serializers.CharField(required=True)
    is_default = serializers.BooleanField(default=False)
    nickname = serializers.CharField(required=False, allow_blank=True)


class AddEWalletSerializer(serializers.Serializer):
    """Сериализатор для добавления электронного кошелька"""
    e_wallet_provider = serializers.CharField(required=True)
    e_wallet_email = serializers.EmailField(required=True)
    is_default = serializers.BooleanField(default=False)
    nickname = serializers.CharField(required=False, allow_blank=True)


class AddCryptoWalletSerializer(serializers.Serializer):
    """Сериализатор для добавления криптовалютного кошелька"""
    crypto_currency = serializers.CharField(required=True)
    crypto_address = serializers.CharField(required=True)
    crypto_network = serializers.CharField(required=False, allow_blank=True)
    crypto_memo = serializers.CharField(required=False, allow_blank=True)
    is_default = serializers.BooleanField(default=False)
    nickname = serializers.CharField(required=False, allow_blank=True)
    
    def validate_crypto_currency(self, value):
        """Проверка поддержки криптовалюты"""
        supported_currencies = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'ADA', 'DOGE', 'SOL']
        value = value.upper()
        
        if value not in supported_currencies:
            raise serializers.ValidationError(f"Unsupported cryptocurrency. Supported: {', '.join(supported_currencies)}")
        
        return value


class PaymentProviderSerializer(serializers.ModelSerializer):
    """Сериализатор для платежных провайдеров"""
    class Meta:
        model = PaymentProvider
        fields = ('id', 'name', 'provider_type', 'is_active', 'supported_currencies',
                  'min_deposit', 'max_deposit', 'min_withdrawal', 'max_withdrawal',
                  'deposit_fee_percentage', 'deposit_fee_fixed', 'withdrawal_fee_percentage',
                  'withdrawal_fee_fixed')


class InitiateDepositSerializer(serializers.Serializer):
    """Сериализатор для инициации депозита"""
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=1)
    payment_method_id = serializers.IntegerField(required=False)
    payment_provider_id = serializers.IntegerField()
    
    def validate_amount(self, value):
        payment_provider_id = self.initial_data.get('payment_provider_id')
        try:
            provider = PaymentProvider.objects.get(pk=payment_provider_id, is_active=True)
            
            if provider.min_deposit and value < provider.min_deposit:
                raise serializers.ValidationError(f"Minimum deposit amount is {provider.min_deposit}")
            
            if provider.max_deposit and value > provider.max_deposit:
                raise serializers.ValidationError(f"Maximum deposit amount is {provider.max_deposit}")
            
            return value
        except PaymentProvider.DoesNotExist:
            # Проверим позже при валидации payment_provider_id
            return value


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    """Сериализатор для запросов на вывод средств"""
    class Meta:
        model = WithdrawalRequest
        fields = ('id', 'user', 'amount', 'payment_method', 'status', 'created_at',
                  'updated_at', 'processed_at', 'rejection_reason')
        read_only_fields = ('id', 'user', 'status', 'created_at', 'updated_at',
                          'processed_at', 'rejection_reason')
    
    def validate_amount(self, value):
        user = self.context['request'].user
        
        if value > user.balance:
            raise serializers.ValidationError("Insufficient funds")
        
        payment_method_id = self.initial_data.get('payment_method')
        try:
            payment_method = PaymentMethod.objects.get(pk=payment_method_id, user=user)
            
            # Проверка минимальной и максимальной суммы вывода в зависимости от метода оплаты
            if payment_method.method_type == 'bank_account':
                provider = PaymentProvider.objects.filter(provider_type='bank_transfer', is_active=True).first()
            elif payment_method.method_type in ['credit_card', 'debit_card']:
                provider = PaymentProvider.objects.filter(provider_type='card', is_active=True).first()
            elif payment_method.method_type == 'e_wallet':
                provider = PaymentProvider.objects.filter(provider_type='e_wallet', is_active=True).first()
            elif payment_method.method_type == 'crypto_wallet':
                provider = PaymentProvider.objects.filter(provider_type='crypto', is_active=True).first()
            else:
                return value
            
            if provider:
                if provider.min_withdrawal and value < provider.min_withdrawal:
                    raise serializers.ValidationError(f"Minimum withdrawal amount is {provider.min_withdrawal}")
                
                if provider.max_withdrawal and value > provider.max_withdrawal:
                    raise serializers.ValidationError(f"Maximum withdrawal amount is {provider.max_withdrawal}")
            
            return value
        except PaymentMethod.DoesNotExist:
            # Проверим позже при валидации payment_method
            return value
    
    def validate_payment_method(self, value):
        user = self.context['request'].user
        
        if value.user != user:
            raise serializers.ValidationError("Invalid payment method")
        
        if not value.is_verified:
            raise serializers.ValidationError("Payment method is not verified")
        
        return value


class DepositTransactionSerializer(serializers.ModelSerializer):
    """Сериализатор для депозитных транзакций"""
    class Meta:
        model = DepositTransaction
        fields = ('id', 'user', 'amount', 'payment_provider', 'payment_method',
                  'provider_transaction_id', 'provider_status', 'transaction',
                  'created_at', 'updated_at', 'completed_at', 'provider_response')
        read_only_fields = fields