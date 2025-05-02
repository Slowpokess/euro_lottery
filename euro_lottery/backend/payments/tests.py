from django.test import TestCase
from django.contrib.auth import get_user_model
from django.conf import settings
from decimal import Decimal
from unittest.mock import patch, MagicMock
import json

from .models import Transaction, PaymentMethod, PaymentProvider, DepositTransaction
from .integrations.stripe_integration import StripePaymentProcessor
from .integrations.paypal_integration import PayPalPaymentProcessor
from .integrations.factory import get_payment_processor

User = get_user_model()


class StripePaymentProcessorTests(TestCase):
    """Тесты для процессора платежей Stripe"""
    
    def setUp(self):
        self.processor = StripePaymentProcessor()
        self.mock_payment_intent = {
            'id': 'pi_test123',
            'client_secret': 'pi_test123_secret',
            'status': 'requires_payment_method',
            'amount': 1000,  # $10.00
            'currency': 'usd',
            'payment_method': None,
            'metadata': {}
        }
    
    @patch('stripe.PaymentIntent.create')
    def test_create_payment(self, mock_create):
        """Тест создания платежа"""
        # Настройка мока
        mock_intent = MagicMock()
        mock_intent.id = self.mock_payment_intent['id']
        mock_intent.client_secret = self.mock_payment_intent['client_secret']
        mock_intent.status = self.mock_payment_intent['status']
        mock_create.return_value = mock_intent
        
        # Вызов метода
        result = self.processor.create_payment(
            amount=Decimal('10.00'),
            description='Test payment'
        )
        
        # Проверка результата
        self.assertEqual(result['id'], 'pi_test123')
        self.assertEqual(result['client_secret'], 'pi_test123_secret')
        self.assertEqual(result['provider'], 'stripe')
        self.assertTrue(result.get('success', False))
        
        # Проверка вызова Stripe
        mock_create.assert_called_once()
        args, kwargs = mock_create.call_args
        self.assertEqual(kwargs['amount'], 1000)  # 10.00 * 100
        self.assertEqual(kwargs['currency'], 'usd')
        self.assertEqual(kwargs['description'], 'Test payment')
    
    @patch('stripe.PaymentIntent.retrieve')
    def test_get_payment_status(self, mock_retrieve):
        """Тест получения статуса платежа"""
        # Настройка мока
        mock_intent = MagicMock()
        mock_intent.id = self.mock_payment_intent['id']
        mock_intent.status = 'succeeded'
        mock_intent.amount = 1000
        mock_intent.currency = 'usd'
        mock_intent.payment_method = 'pm_123'
        mock_intent.metadata = {}
        mock_retrieve.return_value = mock_intent
        
        # Вызов метода
        result = self.processor.get_payment_status('pi_test123')
        
        # Проверка результата
        self.assertEqual(result['id'], 'pi_test123')
        self.assertEqual(result['status'], 'succeeded')
        self.assertEqual(result['amount'], Decimal('10.00'))
        self.assertTrue(result['success'])
        
        # Проверка вызова Stripe
        mock_retrieve.assert_called_once_with('pi_test123')
    
    @patch('stripe.PaymentIntent.retrieve')
    @patch('stripe.PaymentIntent.cancel')
    def test_cancel_payment(self, mock_cancel, mock_retrieve):
        """Тест отмены платежа"""
        # Настройка моков
        mock_intent = MagicMock()
        mock_intent.id = self.mock_payment_intent['id']
        mock_intent.status = 'requires_payment_method'
        mock_intent.amount = 1000
        mock_intent.currency = 'usd'
        mock_retrieve.return_value = mock_intent
        
        mock_canceled = MagicMock()
        mock_canceled.id = self.mock_payment_intent['id']
        mock_canceled.status = 'canceled'
        mock_canceled.amount = 1000
        mock_canceled.currency = 'usd'
        mock_cancel.return_value = mock_canceled
        
        # Вызов метода
        result = self.processor.cancel_payment('pi_test123')
        
        # Проверка результата
        self.assertEqual(result['id'], 'pi_test123')
        self.assertEqual(result['status'], 'canceled')
        self.assertEqual(result['amount'], Decimal('10.00'))
        self.assertTrue(result['success'])
        
        # Проверка вызовов Stripe
        mock_retrieve.assert_called_once_with('pi_test123')
        mock_cancel.assert_called_once_with('pi_test123')
    
    @patch('stripe.PaymentIntent.retrieve')
    def test_cancel_payment_already_completed(self, mock_retrieve):
        """Тест отмены платежа, который уже завершен"""
        # Настройка мока
        mock_intent = MagicMock()
        mock_intent.id = self.mock_payment_intent['id']
        mock_intent.status = 'succeeded'
        mock_retrieve.return_value = mock_intent
        
        # Вызов метода
        result = self.processor.cancel_payment('pi_test123')
        
        # Проверка результата
        self.assertEqual(result['id'], 'pi_test123')
        self.assertEqual(result['status'], 'succeeded')
        self.assertFalse(result['success'])
        self.assertIn('cannot be canceled', result['error'])
        
        # Проверка вызова Stripe
        mock_retrieve.assert_called_once_with('pi_test123')


class PayPalPaymentProcessorTests(TestCase):
    """Тесты для процессора платежей PayPal"""
    
    def setUp(self):
        self.processor = PayPalPaymentProcessor()
        self.mock_order = {
            'id': 'ORDER123',
            'status': 'CREATED',
            'links': [
                {'rel': 'approve', 'href': 'https://paypal.com/approve'},
                {'rel': 'self', 'href': 'https://api.paypal.com/orders/ORDER123'}
            ]
        }
    
    @patch.object(PayPalPaymentProcessor, '_make_request')
    @patch.object(PayPalPaymentProcessor, '_get_access_token')
    def test_create_payment(self, mock_get_token, mock_request):
        """Тест создания платежа"""
        # Настройка моков
        mock_get_token.return_value = 'test_token'
        mock_request.return_value = self.mock_order
        
        # Вызов метода
        result = self.processor.create_payment(
            amount=Decimal('10.00'),
            description='Test payment'
        )
        
        # Проверка результата
        self.assertEqual(result['id'], 'ORDER123')
        self.assertEqual(result['status'], 'CREATED')
        self.assertEqual(result['approval_url'], 'https://paypal.com/approve')
        self.assertTrue(result['success'])
        self.assertEqual(result['provider'], 'paypal')
        
        # Проверка вызова API PayPal
        mock_get_token.assert_called_once()
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        self.assertEqual(args[0], 'POST')
        self.assertEqual(args[1], '/v2/checkout/orders')
        self.assertEqual(kwargs['data']['purchase_units'][0]['amount']['value'], '10.00')
    
    @patch.object(PayPalPaymentProcessor, '_make_request')
    @patch.object(PayPalPaymentProcessor, '_get_access_token')
    def test_get_payment_status(self, mock_get_token, mock_request):
        """Тест получения статуса платежа"""
        # Настройка моков
        mock_get_token.return_value = 'test_token'
        mock_request.return_value = {
            'id': 'ORDER123',
            'status': 'APPROVED'
        }
        
        # Вызов метода
        result = self.processor.get_payment_status('ORDER123')
        
        # Проверка результата
        self.assertEqual(result['id'], 'ORDER123')
        self.assertEqual(result['status'], 'APPROVED')
        self.assertTrue(result['success'])
        
        # Проверка вызова API PayPal
        mock_get_token.assert_called_once()
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        self.assertEqual(args[0], 'GET')
        self.assertEqual(args[1], '/v2/checkout/orders/ORDER123')
    
    @patch.object(PayPalPaymentProcessor, 'get_payment_status')
    @patch.object(PayPalPaymentProcessor, '_make_request')
    @patch.object(PayPalPaymentProcessor, '_get_access_token')
    def test_cancel_payment(self, mock_get_token, mock_request, mock_status):
        """Тест отмены платежа"""
        # Настройка моков
        mock_get_token.return_value = 'test_token'
        mock_status.return_value = {
            'id': 'ORDER123',
            'status': 'CREATED',
            'success': True
        }
        mock_request.return_value = {}  # PayPal returns 204 No Content
        
        # Вызов метода
        result = self.processor.cancel_payment('ORDER123')
        
        # Проверка результата
        self.assertEqual(result['id'], 'ORDER123')
        self.assertEqual(result['status'], 'CANCELLED')
        self.assertTrue(result['success'])
        
        # Проверка вызовов API PayPal
        mock_status.assert_called_once_with('ORDER123')
        mock_request.assert_called_once()
        args, kwargs = mock_request.call_args
        self.assertEqual(args[0], 'POST')
        self.assertEqual(args[1], '/v2/checkout/orders/ORDER123/cancel')
    
    @patch.object(PayPalPaymentProcessor, 'get_payment_status')
    def test_cancel_payment_already_completed(self, mock_status):
        """Тест отмены платежа, который уже завершен"""
        # Настройка моков
        mock_status.return_value = {
            'id': 'ORDER123',
            'status': 'COMPLETED',
            'success': True
        }
        
        # Вызов метода
        result = self.processor.cancel_payment('ORDER123')
        
        # Проверка результата
        self.assertEqual(result['id'], 'ORDER123')
        self.assertEqual(result['status'], 'COMPLETED')
        self.assertFalse(result['success'])
        self.assertIn('cannot be canceled', result['error'])
        
        # Проверка вызова API PayPal
        mock_status.assert_called_once_with('ORDER123')


class PaymentFactoryTests(TestCase):
    """Тесты для фабрики процессоров платежей"""
    
    def test_get_payment_processor_stripe(self):
        """Тест получения процессора Stripe"""
        processor = get_payment_processor('stripe')
        self.assertIsInstance(processor, StripePaymentProcessor)
    
    def test_get_payment_processor_paypal(self):
        """Тест получения процессора PayPal"""
        processor = get_payment_processor('paypal')
        self.assertIsInstance(processor, PayPalPaymentProcessor)
    
    def test_get_payment_processor_invalid(self):
        """Тест получения несуществующего процессора"""
        with self.assertRaises(ValueError):
            get_payment_processor('invalid_provider')


class PaymentViewsIntegrationTests(TestCase):
    """Интеграционные тесты для представлений платежей"""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        self.payment_provider = PaymentProvider.objects.create(
            name='Test Stripe',
            provider_type='stripe',
            is_active=True
        )
        
        self.client.login(username='testuser', password='testpassword')
    
    @patch('payments.integrations.stripe_integration.StripePaymentProcessor.create_payment')
    def test_initiate_deposit_view(self, mock_create_payment):
        """Тест представления для инициации депозита"""
        # Настройка мока
        mock_create_payment.return_value = {
            'id': 'pi_test123',
            'client_secret': 'pi_test123_secret',
            'status': 'requires_payment_method',
            'success': True,
            'provider': 'stripe'
        }
        
        # Отправка запроса
        response = self.client.post('/api/payments/deposit/initiate/', {
            'amount': '10.00',
            'payment_provider_id': self.payment_provider.id
        }, content_type='application/json')
        
        # Проверка ответа
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.content)
        self.assertEqual(data['client_secret'], 'pi_test123_secret')
        
        # Проверка создания транзакции в БД
        self.assertTrue(Transaction.objects.filter(user=self.user, transaction_type='deposit').exists())
        self.assertTrue(DepositTransaction.objects.filter(user=self.user).exists())