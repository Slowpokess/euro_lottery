# Система интеграции платежей

Этот каталог содержит реализацию модульной системы интеграции платежей для приложения Euro Lottery.

## Архитектура

Платежная система разработана с использованием следующих архитектурных принципов:

1. **Разделение интерфейсов**: Чистые интерфейсы, определяющие контракт для процессоров платежей
2. **Инверсия зависимостей**: Модули высокого уровня (представления) зависят от абстракций, а не от конкретных реализаций
3. **Фабричный паттерн**: Фабрика для создания экземпляров соответствующего процессора платежей
4. **Паттерн Стратегия**: Разные платежные стратегии (Stripe, PayPal, Crypto) используют общий интерфейс

## Структура файлов

- `base.py` - Абстрактные интерфейсы для процессоров платежей
- `factory.py` - Фабричные функции для создания процессоров платежей
- `stripe_integration.py` - Реализация интерфейсов платежей для Stripe
- `paypal_integration.py` - Реализация интерфейсов платежей для PayPal
- `crypto_integration.py` - Реализация интерфейсов платежей для криптовалют (CoinPayments API)

## Интерфейсы

### PaymentProcessorInterface

Основной интерфейс для обработки платежей:

- `create_payment()` - Создает платежное намерение/заказ
- `confirm_payment()` - Подтверждает платеж
- `get_payment_status()` - Получает текущий статус платежа
- `cancel_payment()` - Отменяет ожидающий платеж
- `refund_payment()` - Обрабатывает возврат средств

### PaymentMethodInterface

Интерфейс для управления методами оплаты клиентов:

- `create_customer()` - Создает клиента в платежной системе
- `add_payment_method()` - Добавляет метод оплаты клиенту
- `list_payment_methods()` - Получает список методов оплаты клиента
- `delete_payment_method()` - Удаляет метод оплаты

### WebhookHandlerInterface

Интерфейс для обработки вебхуков от платежных систем:

- `parse_webhook()` - Парсит и проверяет данные вебхука
- `handle_webhook_event()` - Обрабатывает события вебхуков

## Поддерживаемые платежные системы

### Stripe

Интеграция с Stripe поддерживает следующие функции:
- Оплата кредитными и дебетовыми картами
- Подтверждение платежей
- Отмена платежей
- Возврат средств
- Сохранение методов оплаты
- Обработка вебхуков

### PayPal

Интеграция с PayPal поддерживает следующие функции:
- Создание платежей с редиректом на PayPal
- Подтверждение платежей
- Отмена платежей
- Возврат средств
- Обработка вебхуков

### Криптовалюты (CoinPayments)

Интеграция с CoinPayments поддерживает следующие функции:
- Создание платежей в различных криптовалютах
- Отслеживание статуса платежей
- Обработка вебхуков для автоматического обновления статуса
- Поддерживаемые валюты: BTC, ETH, USDT, USDC, BNB, XRP, ADA, DOGE, SOL и другие

## Использование

Пример использования процессора платежей в коде:

```python
from payments.integrations.factory import get_payment_processor
from decimal import Decimal

# Получаем процессор по умолчанию или указываем конкретный
processor = get_payment_processor('stripe')  # или 'paypal', 'crypto'

# Создаем платеж
payment_result = processor.create_payment(
    amount=Decimal('10.00'),
    description='Пополнение счета',
    metadata={'user_id': user.id, 'transaction_id': transaction.id}
)

# Проверяем статус платежа
status = processor.get_payment_status(payment_result['id'])

# Отменяем платеж
processor.cancel_payment(payment_result['id'])

# Возвращаем средства
processor.refund_payment(payment_result['id'])
```

## Получение доступных методов оплаты

Для получения списка доступных методов оплаты можно использовать:

```python
from payments.integrations.factory import get_available_payment_methods, get_processor_config

# Получаем доступные методы оплаты
methods = get_available_payment_methods()

# Получаем конфигурацию процессоров для фронтенда
config = get_processor_config()
```

## Добавление нового процессора платежей

Для добавления нового процессора платежей:

1. Создайте новый файл `new_processor_integration.py`
2. Реализуйте требуемые интерфейсы
3. Добавьте процессор в фабрику в `factory.py`

Пример:

```python
# В new_processor_integration.py
from .base import PaymentProcessorInterface

class NewPaymentProcessor(PaymentProcessorInterface):
    # Реализуйте все требуемые методы

# В factory.py
from .new_processor_integration import NewPaymentProcessor

def get_payment_processor(provider: str = None):
    # ...
    elif provider == 'new_processor':
        return NewPaymentProcessor()
    # ...
```

## Тестирование

Процессоры платежей и интеграции покрыты модульными тестами в `/payments/tests.py`.
Для запуска тестов выполните:

```
python manage.py test payments
```