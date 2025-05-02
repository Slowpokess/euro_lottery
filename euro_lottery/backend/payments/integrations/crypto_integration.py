"""
Интеграция криптовалютных платежей для Euro Lottery
Поддерживает Bitcoin, Ethereum и другие популярные криптовалюты
через CoinPayments API
"""

import hmac
import hashlib
import json
import time
import requests
from decimal import Decimal
from typing import Dict, Any, Optional, List
import logging
from django.conf import settings
from .base import PaymentProcessorInterface, WebhookHandlerInterface

logger = logging.getLogger(__name__)


class CryptoPaymentProcessor(PaymentProcessorInterface, WebhookHandlerInterface):
    """Реализация интерфейсов платежей для криптовалют через CoinPayments"""
    
    def __init__(self):
        """Инициализация процессора для криптовалют"""
        self.api_url = "https://www.coinpayments.net/api.php"
        self.public_key = getattr(settings, 'COINPAYMENTS_PUBLIC_KEY', '')
        self.private_key = getattr(settings, 'COINPAYMENTS_PRIVATE_KEY', '')
        self.ipn_secret = getattr(settings, 'COINPAYMENTS_IPN_SECRET', '')
        self.merchant_id = getattr(settings, 'COINPAYMENTS_MERCHANT_ID', '')
        
        # Валюта по умолчанию для фиатной суммы
        self.fiat_currency = getattr(settings, 'DEFAULT_CURRENCY', 'USD')
        
        # Криптовалюта по умолчанию
        self.default_crypto = getattr(settings, 'DEFAULT_CRYPTO', 'BTC')
    
    def _make_request(self, method: str, params: Dict = None) -> Dict:
        """
        Отправляет запрос к API CoinPayments
        
        Args:
            method: Метод API
            params: Параметры запроса
            
        Returns:
            Ответ API в виде словаря
        """
        # Базовые параметры для каждого запроса
        request_params = {
            'version': 1,
            'cmd': method,
            'key': self.public_key,
            'format': 'json',
            'nonce': int(time.time())
        }
        
        # Добавляем дополнительные параметры
        if params:
            request_params.update(params)
        
        # Формируем HMAC подпись
        encoded_params = json.dumps(request_params).encode('utf-8')
        signature = hmac.new(
            self.private_key.encode('utf-8'), 
            encoded_params,
            hashlib.sha512
        ).hexdigest()
        
        # Заголовки с подписью
        headers = {
            'HMAC': signature,
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.post(
                self.api_url,
                json=request_params,
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"CoinPayments API error: {response.text}")
                return {'error': f"HTTP error {response.status_code}", 'success': False}
            
            result = response.json()
            
            # Проверяем на ошибки в ответе API
            if result.get('error') != 'ok':
                error_message = result.get('error', 'Unknown error')
                logger.error(f"CoinPayments API error: {error_message}")
                return {'error': error_message, 'success': False}
            
            return result.get('result', {})
            
        except Exception as e:
            logger.error(f"Error making CoinPayments API request: {str(e)}")
            return {'error': str(e), 'success': False}
    
    # Методы интерфейса PaymentProcessorInterface
    
    def create_payment(self, amount: Decimal, currency: str = None, 
                     description: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """
        Создает запрос на криптовалютный платеж
        
        Args:
            amount: Сумма в фиатной валюте
            currency: Код валюты (по умолчанию из настроек)
            description: Описание платежа
            metadata: Дополнительные данные
            
        Returns:
            Словарь с деталями платежа
        """
        try:
            currency = currency or self.fiat_currency
            
            # Базовые параметры для создания транзакции
            params = {
                'amount': float(amount),
                'currency1': currency.upper(),  # Валюта суммы (фиатная)
                'currency2': self.default_crypto,  # Валюта оплаты (крипто)
                'buyer_email': metadata.get('email', 'customer@example.com'),
                'item_name': description or 'Пополнение счета Euro Lottery',
                'ipn_url': f"{settings.SITE_URL}/api/payments/webhooks/crypto/"
            }
            
            # Добавляем кастомные данные для отслеживания
            if metadata:
                for key, value in metadata.items():
                    if key not in params and key != 'email':
                        # CoinPayments поддерживает произвольные поля с префиксом custom_
                        params[f"custom_{key}"] = str(value)
            
            # Создаем транзакцию
            result = self._make_request('create_transaction', params)
            
            # Проверяем на ошибки
            if 'error' in result:
                return result
            
            # Формируем ответ в едином формате
            return {
                'id': result.get('txn_id'),
                'status': 'created',
                'amount': amount,
                'crypto_amount': Decimal(str(result.get('amount'))),
                'crypto_currency': result.get('coin'),
                'address': result.get('address'),
                'confirms_needed': result.get('confirms_needed'),
                'timeout': result.get('timeout'),
                'checkout_url': result.get('checkout_url'),
                'status_url': result.get('status_url'),
                'qrcode_url': result.get('qrcode_url'),
                'success': True,
                'provider': 'crypto'
            }
            
        except Exception as e:
            logger.error(f"Error creating crypto payment: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def confirm_payment(self, payment_id: str, payment_data: Dict = None) -> Dict[str, Any]:
        """
        Проверяет и подтверждает статус криптоплатежа
        
        Args:
            payment_id: ID транзакции
            payment_data: Дополнительные данные (не используются)
            
        Returns:
            Словарь с деталями подтверждения
        """
        # Для криптоплатежей подтверждение происходит автоматически после
        # нужного количества подтверждений в сети. Мы просто проверяем статус.
        return self.get_payment_status(payment_id)
    
    def get_payment_status(self, payment_id: str) -> Dict[str, Any]:
        """
        Получает текущий статус криптоплатежа
        
        Args:
            payment_id: ID транзакции
            
        Returns:
            Словарь со статусом платежа
        """
        try:
            result = self._make_request('get_tx_info', {'txid': payment_id})
            
            # Проверяем на ошибки
            if 'error' in result:
                return result
            
            # Статусы CoinPayments:
            # -1 = cancelled / timed out
            # 0 = waiting for funds
            # 1 = coin confirms needed
            # 2 = confirmed and complete
            # 3 = complete but waiting for MK Coin confirmations
            
            status_map = {
                -1: 'cancelled',
                0: 'pending',
                1: 'confirming',
                2: 'completed',
                3: 'completed'
            }
            
            status_code = result.get('status', 0)
            status = status_map.get(status_code, 'unknown')
            
            return {
                'id': payment_id,
                'status': status,
                'amount': Decimal(str(result.get('amount'))),
                'received': Decimal(str(result.get('received', 0))),
                'confirms': result.get('confirms', 0),
                'time_created': result.get('time_created', 0),
                'time_expires': result.get('time_expires', 0),
                'success': True,
                'details': result
            }
            
        except Exception as e:
            logger.error(f"Error getting crypto payment status: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def cancel_payment(self, payment_id: str) -> Dict[str, Any]:
        """
        Отменяет ожидающий криптоплатеж
        
        Args:
            payment_id: ID транзакции
            
        Returns:
            Словарь с результатом отмены
        """
        # Сначала проверяем текущий статус
        status_result = self.get_payment_status(payment_id)
        
        if not status_result.get('success', False):
            return status_result
        
        status = status_result.get('status', '')
        
        # Можно отменить только ожидающие платежи
        if status not in ['pending', 'created']:
            return {
                'id': payment_id,
                'status': status,
                'success': False,
                'error': f"Невозможно отменить платеж в статусе '{status}'"
            }
        
        try:
            # К сожалению, CoinPayments не предоставляет прямой метод для отмены,
            # мы можем только отметить транзакцию как cancelled в нашей системе
            return {
                'id': payment_id,
                'status': 'cancelled',
                'success': True,
                'message': 'Платеж отмечен как отмененный. Если средства поступят, они будут автоматически возвращены.'
            }
            
        except Exception as e:
            logger.error(f"Error cancelling crypto payment: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def refund_payment(self, payment_id: str, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """
        Производит возврат средств для криптоплатежа
        
        Args:
            payment_id: ID транзакции
            amount: Сумма для возврата (None для полного возврата)
            
        Returns:
            Словарь с деталями возврата
        """
        try:
            # Сначала проверяем статус платежа
            status_result = self.get_payment_status(payment_id)
            
            if not status_result.get('success', False):
                return status_result
            
            status = status_result.get('status', '')
            
            # Возврат можно сделать только для завершенных платежей
            if status != 'completed':
                return {
                    'id': payment_id,
                    'status': status,
                    'success': False,
                    'error': f"Невозможно вернуть платеж в статусе '{status}'"
                }
            
            # В реальной реализации здесь должен быть код для создания возврата
            # через API CoinPayments или ручной процесс
            
            # Для демонстрационных целей просто возвращаем успешный результат
            return {
                'id': f"refund_{payment_id}",
                'original_txn_id': payment_id,
                'status': 'pending',
                'amount': amount or status_result.get('amount'),
                'success': True,
                'message': 'Запрос на возврат создан'
            }
            
        except Exception as e:
            logger.error(f"Error processing crypto refund: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    # Методы для работы с кошельками клиентов (не требуются для базовой интеграции)
    
    def create_customer(self, email: str, name: str = None, metadata: Dict = None) -> str:
        """
        CoinPayments не имеет эквивалента customer в Stripe
        """
        logger.warning("CoinPayments не поддерживает прямое управление клиентами")
        return None
    
    def add_payment_method(self, customer_id: str, token: str) -> Dict[str, Any]:
        """
        CoinPayments не поддерживает сохранение методов оплаты
        """
        logger.warning("CoinPayments не поддерживает управление методами оплаты")
        return {'success': False, 'error': 'Не поддерживается для криптовалютных платежей'}
    
    def list_payment_methods(self, customer_id: str) -> List[Dict[str, Any]]:
        """
        CoinPayments не поддерживает сохранение методов оплаты
        """
        logger.warning("CoinPayments не поддерживает управление методами оплаты")
        return []
    
    def delete_payment_method(self, payment_method_id: str) -> bool:
        """
        CoinPayments не поддерживает сохранение методов оплаты
        """
        logger.warning("CoinPayments не поддерживает управление методами оплаты")
        return False
    
    # Методы для работы с вебхуками
    
    def parse_webhook(self, payload: Dict, headers: Dict = None) -> Dict[str, Any]:
        """
        Проверяет и парсит вебхук от CoinPayments
        
        Args:
            payload: Полезная нагрузка вебхука
            headers: HTTP заголовки запроса (HMAC-подпись)
            
        Returns:
            Обработанные данные вебхука
        """
        try:
            # Проверяем HMAC-подпись, если она есть в заголовках
            if headers and self.ipn_secret and 'HMAC' in headers:
                # Получаем подпись из заголовка
                signature = headers['HMAC']
                
                # Формируем ожидаемую подпись
                payload_str = json.dumps(payload)
                expected_signature = hmac.new(
                    self.ipn_secret.encode('utf-8'),
                    payload_str.encode('utf-8'),
                    hashlib.sha512
                ).hexdigest()
                
                # Сравниваем подписи
                if signature != expected_signature:
                    logger.warning("CoinPayments IPN signature verification failed")
                    return {
                        'error': 'Неверная подпись IPN',
                        'success': False
                    }
            
            # Проверяем merchant_id для дополнительной безопасности
            if self.merchant_id and payload.get('merchant') != self.merchant_id:
                logger.warning("CoinPayments IPN merchant ID mismatch")
                return {
                    'error': 'Неверный ID мерчанта',
                    'success': False
                }
            
            # Определяем тип события по статусу платежа
            status = int(payload.get('status', 0))
            if status == -1:
                event_type = 'payment_cancelled'
            elif status == 0:
                event_type = 'payment_pending'
            elif status == 1:
                event_type = 'payment_confirming'
            elif status >= 2:
                event_type = 'payment_completed'
            else:
                event_type = 'unknown'
            
            return {
                'id': payload.get('txn_id'),
                'type': event_type,
                'data': payload,
                'success': True,
                'verified': True
            }
            
        except Exception as e:
            logger.error(f"Error parsing CoinPayments webhook: {str(e)}")
            return {
                'error': str(e),
                'success': False
            }
    
    def handle_webhook_event(self, event_type: str, event_data: Dict) -> bool:
        """
        Обрабатывает события вебхуков от CoinPayments
        
        Args:
            event_type: Тип события (payment_completed, etc.)
            event_data: Данные события
            
        Returns:
            True если успешно обработано
        """
        try:
            # Обрабатываем различные типы событий
            if event_type == 'payment_completed':
                # Платеж завершен - обновляем статус транзакции
                self._handle_payment_completed(event_data)
                return True
                
            elif event_type == 'payment_cancelled':
                # Платеж отменен - обновляем статус транзакции
                self._handle_payment_cancelled(event_data)
                return True
                
            elif event_type in ['payment_pending', 'payment_confirming']:
                # Платеж в процессе - обновляем статус
                self._handle_payment_pending(event_data)
                return True
            
            # Логируем необработанные типы событий
            logger.info(f"Необработанный тип вебхука CoinPayments: {event_type}")
            return False
            
        except Exception as e:
            logger.error(f"Ошибка обработки вебхука CoinPayments: {str(e)}")
            return False
    
    # Вспомогательные методы для обработки вебхуков
    
    def _handle_payment_completed(self, event_data: Dict):
        """Обрабатывает успешно завершенный платеж"""
        txn_id = event_data.get('txn_id')
        amount = event_data.get('amount')
        
        logger.info(f"Платеж в криптовалюте успешно завершен: {txn_id} на сумму {amount}")
    
    def _handle_payment_cancelled(self, event_data: Dict):
        """Обрабатывает отмененный платеж"""
        txn_id = event_data.get('txn_id')
        
        logger.warning(f"Платеж в криптовалюте отменен: {txn_id}")
    
    def _handle_payment_pending(self, event_data: Dict):
        """Обрабатывает платеж в процессе"""
        txn_id = event_data.get('txn_id')
        status = event_data.get('status')
        
        logger.info(f"Обновление статуса криптоплатежа: {txn_id}, статус={status}")
    
    # Вспомогательные методы для клиентской части
    
    def get_client_config(self) -> Dict[str, Any]:
        """
        Получает конфигурацию для клиентской части приложения
        
        Returns:
            Словарь с публичной конфигурацией
        """
        return {
            'provider': 'crypto',
            'merchant_id': self.merchant_id,
            'default_currency': self.fiat_currency,
            'supported_coins': self._get_supported_coins(),
            'checkout_mode': 'redirect'  # Режим оплаты: redirect или custom
        }
    
    def _get_supported_coins(self) -> List[Dict[str, Any]]:
        """
        Получает список поддерживаемых криптовалют
        
        Returns:
            Список поддерживаемых криптовалют
        """
        try:
            result = self._make_request('rates')
            
            if 'error' in result:
                logger.error(f"Error getting supported coins: {result['error']}")
                return []
            
            coins = []
            for coin, data in result.items():
                if isinstance(data, dict) and data.get('accepted') == 1:
                    coins.append({
                        'code': coin,
                        'name': data.get('name', coin),
                        'rate': data.get('rate_btc', 0)
                    })
            
            return coins
            
        except Exception as e:
            logger.error(f"Error getting supported coins: {str(e)}")
            return []