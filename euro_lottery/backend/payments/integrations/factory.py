"""
Фабрика для создания экземпляров процессоров платежей на основе конфигурации
"""

from typing import Dict, Optional
from django.conf import settings
from .base import PaymentProcessorInterface
from .stripe_integration import StripePaymentProcessor
from .paypal_integration import PayPalPaymentProcessor
from .crypto_integration import CryptoPaymentProcessor


def get_payment_processor(provider: str = None) -> PaymentProcessorInterface:
    """
    Фабричная функция для получения процессора платежей по имени провайдера
    
    Args:
        provider: Название платежного провайдера (stripe, paypal, crypto)
                 Если не указано, используется значение по умолчанию из настроек
    
    Returns:
        Экземпляр класса, реализующего PaymentProcessorInterface
    
    Raises:
        ValueError: Если провайдер не поддерживается
    """
    # Если провайдер не указан, получаем значение по умолчанию из настроек
    if not provider:
        provider = getattr(settings, 'DEFAULT_PAYMENT_PROVIDER', 'stripe')
    
    # Преобразуем в нижний регистр
    provider = provider.lower()
    
    # Создаем процессор в зависимости от провайдера
    if provider == 'stripe':
        return StripePaymentProcessor()
    elif provider == 'paypal':
        return PayPalPaymentProcessor()
    elif provider == 'crypto':
        return CryptoPaymentProcessor()
    else:
        raise ValueError(f"Неподдерживаемый платежный провайдер: {provider}")


def get_processor_config() -> Dict[str, Dict]:
    """
    Получает конфигурацию всех платежных процессоров для клиентской части
    
    Returns:
        Словарь с конфигурацией для каждого провайдера
    """
    # Инициализируем пустой конфиг
    config = {}
    
    # Добавляем Stripe, если настроен
    if hasattr(settings, 'STRIPE_PUBLIC_KEY') and settings.STRIPE_PUBLIC_KEY:
        stripe_processor = StripePaymentProcessor()
        config['stripe'] = stripe_processor.get_client_config()
    
    # Добавляем PayPal, если настроен
    if hasattr(settings, 'PAYPAL_CLIENT_ID') and settings.PAYPAL_CLIENT_ID:
        paypal_processor = PayPalPaymentProcessor()
        config['paypal'] = paypal_processor.get_client_config()
    
    # Добавляем криптовалютные платежи, если настроены
    if hasattr(settings, 'COINPAYMENTS_PUBLIC_KEY') and settings.COINPAYMENTS_PUBLIC_KEY:
        crypto_processor = CryptoPaymentProcessor()
        config['crypto'] = crypto_processor.get_client_config()
    
    return config


def get_available_payment_methods() -> Dict[str, Dict]:
    """
    Получает список доступных методов оплаты для отображения пользователю
    
    Returns:
        Словарь с информацией о доступных методах оплаты
    """
    methods = {}
    
    # Получаем все настроенные процессоры
    config = get_processor_config()
    
    # Формируем информацию о методах оплаты
    if 'stripe' in config:
        methods['card'] = {
            'name': 'Банковская карта',
            'provider': 'stripe',
            'icon': 'credit-card',
            'description': 'Оплата банковской картой Visa, MasterCard, Мир'
        }
    
    if 'paypal' in config:
        methods['paypal'] = {
            'name': 'PayPal',
            'provider': 'paypal',
            'icon': 'paypal',
            'description': 'Оплата через систему PayPal'
        }
    
    if 'crypto' in config:
        methods['crypto'] = {
            'name': 'Криптовалюта',
            'provider': 'crypto',
            'icon': 'bitcoin',
            'description': 'Оплата в Bitcoin, Ethereum и других криптовалютах'
        }
    
    return methods