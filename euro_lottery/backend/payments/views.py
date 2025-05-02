from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings
from django.db import transaction
from django.utils import timezone
import stripe
import json
import uuid
import hmac
import hashlib
import base64
import requests

from .models import (
    Transaction, PaymentMethod, PaymentProvider, 
    WithdrawalRequest, DepositTransaction
)
from .serializers import (
    TransactionSerializer, PaymentMethodSerializer, PaymentProviderSerializer,
    InitiateDepositSerializer, WithdrawalRequestSerializer, DepositTransactionSerializer,
    AddCreditCardSerializer, AddBankAccountSerializer, AddEWalletSerializer,
    AddCryptoWalletSerializer
)
from users.models import UserActivity


class TransactionListView(generics.ListAPIView):
    """Представление для списка транзакций пользователя"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = TransactionSerializer
    
    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user).order_by('-created_at')
        
        # Фильтрация по типу транзакции
        transaction_type = self.request.query_params.get('type', None)
        if transaction_type:
            types = transaction_type.split(',')
            queryset = queryset.filter(transaction_type__in=types)
        
        # Фильтрация по статусу
        status_param = self.request.query_params.get('status', None)
        if status_param:
            statuses = status_param.split(',')
            queryset = queryset.filter(status__in=statuses)
        
        # Фильтрация по дате
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
        
        return queryset


class TransactionDetailView(generics.RetrieveAPIView):
    """Представление для детальной информации о транзакции"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = TransactionSerializer
    lookup_field = 'transaction_id'
    
    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)


class PaymentMethodListView(generics.ListAPIView):
    """Представление для списка методов оплаты пользователя"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = PaymentMethodSerializer
    
    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)


class AddPaymentMethodView(APIView):
    """Представление для добавления метода оплаты"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        method_type = request.data.get('method_type')
        
        if not method_type:
            return Response(
                {"error": "Method type is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if method_type in ['credit_card', 'debit_card']:
            serializer = AddCreditCardSerializer(data=request.data)
        elif method_type == 'bank_account':
            serializer = AddBankAccountSerializer(data=request.data)
        elif method_type == 'e_wallet':
            serializer = AddEWalletSerializer(data=request.data)
        elif method_type == 'crypto_wallet':
            serializer = AddCryptoWalletSerializer(data=request.data)
        else:
            return Response(
                {"error": "Invalid method type"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Обработка в зависимости от типа метода оплаты
        if method_type in ['credit_card', 'debit_card']:
            return self._add_credit_card(request, serializer.validated_data)
        elif method_type == 'bank_account':
            return self._add_bank_account(request, serializer.validated_data)
        elif method_type == 'e_wallet':
            return self._add_e_wallet(request, serializer.validated_data)
        elif method_type == 'crypto_wallet':
            return self._add_crypto_wallet(request, serializer.validated_data)
    
    def _add_credit_card(self, request, validated_data):
        """Добавление кредитной карты"""
        user = request.user
        card_token = validated_data.get('card_token')
        is_default = validated_data.get('is_default', False)
        nickname = validated_data.get('nickname', '')
        
        try:
            # Инициализация Stripe
            stripe.api_key = settings.PAYMENT_PROVIDERS['STRIPE']['SECRET_KEY']
            
            # Получение информации о карте из токена
            card_info = stripe.Token.retrieve(card_token)
            
            # Создание метода оплаты
            payment_method = PaymentMethod.objects.create(
                user=user,
                method_type='credit_card',
                card_last_four=card_info.card.last4,
                card_expiry_month=card_info.card.exp_month,
                card_expiry_year=card_info.card.exp_year,
                card_brand=card_info.card.brand,
                is_default=is_default,
                nickname=nickname,
                provider_token=card_token
            )
            
            # Если это дефолтный метод, сбрасываем дефолт у других методов
            if is_default:
                PaymentMethod.objects.filter(user=user).exclude(id=payment_method.id).update(is_default=False)
            
            # Регистрация активности пользователя
            UserActivity.objects.create(
                user=user,
                activity_type='add_payment_method',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={'method_type': 'credit_card', 'card_brand': card_info.card.brand}
            )
            
            return Response(PaymentMethodSerializer(payment_method).data, status=status.HTTP_201_CREATED)
            
        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _add_bank_account(self, request, validated_data):
        """Добавление банковского счета"""
        user = request.user
        bank_name = validated_data.get('bank_name')
        account_number = validated_data.get('account_number')
        routing_number = validated_data.get('routing_number')
        account_holder_name = validated_data.get('account_holder_name')
        is_default = validated_data.get('is_default', False)
        nickname = validated_data.get('nickname', '')
        
        # Маскируем номер счета для безопасности
        account_last_four = account_number[-4:] if len(account_number) >= 4 else account_number
        
        # Создание метода оплаты
        payment_method = PaymentMethod.objects.create(
            user=user,
            method_type='bank_account',
            bank_name=bank_name,
            account_last_four=account_last_four,
            is_default=is_default,
            nickname=nickname,
            # Сохраняем зашифрованные данные или токен от платежного провайдера
            provider_token=self._encrypt_bank_data(account_number, routing_number, account_holder_name)
        )
        
        # Если это дефолтный метод, сбрасываем дефолт у других методов
        if is_default:
            PaymentMethod.objects.filter(user=user).exclude(id=payment_method.id).update(is_default=False)
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=user,
            activity_type='add_payment_method',
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={'method_type': 'bank_account', 'bank_name': bank_name}
        )
        
        return Response(PaymentMethodSerializer(payment_method).data, status=status.HTTP_201_CREATED)
    
    def _add_e_wallet(self, request, validated_data):
        """Добавление электронного кошелька"""
        user = request.user
        e_wallet_provider = validated_data.get('e_wallet_provider')
        e_wallet_email = validated_data.get('e_wallet_email')
        is_default = validated_data.get('is_default', False)
        nickname = validated_data.get('nickname', '')
        
        # Создание метода оплаты
        payment_method = PaymentMethod.objects.create(
            user=user,
            method_type='e_wallet',
            e_wallet_provider=e_wallet_provider,
            e_wallet_email=e_wallet_email,
            is_default=is_default,
            nickname=nickname
        )
        
        # Если это дефолтный метод, сбрасываем дефолт у других методов
        if is_default:
            PaymentMethod.objects.filter(user=user).exclude(id=payment_method.id).update(is_default=False)
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=user,
            activity_type='add_payment_method',
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={'method_type': 'e_wallet', 'provider': e_wallet_provider}
        )
        
        return Response(PaymentMethodSerializer(payment_method).data, status=status.HTTP_201_CREATED)
        
    def _add_crypto_wallet(self, request, validated_data):
        """Добавление криптовалютного кошелька"""
        user = request.user
        crypto_currency = validated_data.get('crypto_currency')
        crypto_address = validated_data.get('crypto_address')
        crypto_network = validated_data.get('crypto_network', None)
        crypto_memo = validated_data.get('crypto_memo', None)
        is_default = validated_data.get('is_default', False)
        nickname = validated_data.get('nickname', '')
        
        # Проверка адреса на действительность (можно добавить проверку формата в зависимости от валюты)
        if not self._validate_crypto_address(crypto_currency, crypto_address, crypto_network):
            return Response(
                {"error": "Invalid cryptocurrency address format"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создание метода оплаты
        payment_method = PaymentMethod.objects.create(
            user=user,
            method_type='crypto_wallet',
            crypto_currency=crypto_currency,
            crypto_address=crypto_address,
            crypto_network=crypto_network,
            crypto_memo=crypto_memo,
            is_default=is_default,
            nickname=nickname or f"{crypto_currency} Wallet"
        )
        
        # Если это дефолтный метод, сбрасываем дефолт у других методов
        if is_default:
            PaymentMethod.objects.filter(user=user).exclude(id=payment_method.id).update(is_default=False)
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=user,
            activity_type='add_payment_method',
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={
                'method_type': 'crypto_wallet', 
                'currency': crypto_currency,
                'network': crypto_network
            }
        )
        
        return Response(PaymentMethodSerializer(payment_method).data, status=status.HTTP_201_CREATED)
    
    def _validate_crypto_address(self, currency, address, network=None):
        """
        Проверка криптовалютного адреса на действительность
        
        В реальном приложении здесь должна быть проверка формата адреса
        в зависимости от типа валюты и сети
        """
        # Простая валидация длины адреса
        min_length = 26  # Минимальная длина для большинства криптовалютных адресов
        
        if not address or len(address) < min_length:
            return False
            
        # Дополнительные проверки формата в зависимости от валюты
        if currency == 'BTC':
            # Проверка формата BTC адреса - начинается с 1, 3 или bc1
            return address.startswith(('1', '3', 'bc1'))
        elif currency == 'ETH':
            # Проверка формата ETH адреса - начинается с 0x и имеет длину 42 символа
            return address.startswith('0x') and len(address) == 42
        elif currency == 'XRP':
            # Проверка формата XRP адреса - начинается с r и имеет длину от 25 до 35 символов
            return address.startswith('r') and 25 <= len(address) <= 35
        
        # По умолчанию просто проверяем минимальную длину
        return True
    
    def _encrypt_bank_data(self, account_number, routing_number, account_holder_name):
        """Шифрование банковских данных"""
        # В реальном приложении здесь должна быть реализация шифрования
        # Для демонстрации просто создаем токен
        data = f"{account_number}:{routing_number}:{account_holder_name}"
        token = base64.b64encode(data.encode()).decode()
        return token
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class DeletePaymentMethodView(generics.DestroyAPIView):
    """Представление для удаления метода оплаты"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)
    
    def perform_destroy(self, instance):
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=self.request.user,
            activity_type='delete_payment_method',
            ip_address=self._get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            details={'method_type': instance.method_type, 'id': instance.id}
        )
        
        # Удаление метода оплаты
        instance.delete()
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SetDefaultPaymentMethodView(APIView):
    """Представление для установки метода оплаты по умолчанию"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        try:
            payment_method = PaymentMethod.objects.get(pk=pk, user=request.user)
            
            # Сбрасываем дефолт у всех методов пользователя
            PaymentMethod.objects.filter(user=request.user).update(is_default=False)
            
            # Устанавливаем дефолт для выбранного метода
            payment_method.is_default = True
            payment_method.save()
            
            # Регистрация активности пользователя
            UserActivity.objects.create(
                user=request.user,
                activity_type='set_default_payment_method',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={'method_type': payment_method.method_type, 'id': payment_method.id}
            )
            
            return Response(
                {"message": "Default payment method updated successfully"},
                status=status.HTTP_200_OK
            )
            
        except PaymentMethod.DoesNotExist:
            return Response(
                {"error": "Payment method not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class InitiateDepositView(APIView):
    """Представление для инициации депозита"""
    permission_classes = (permissions.IsAuthenticated,)
    
    @transaction.atomic
    def post(self, request):
        serializer = InitiateDepositSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        amount = serializer.validated_data.get('amount')
        payment_provider_id = serializer.validated_data.get('payment_provider_id')
        payment_method_id = serializer.validated_data.get('payment_method_id')
        
        # Получение платежного провайдера
        try:
            payment_provider = PaymentProvider.objects.get(pk=payment_provider_id, is_active=True)
        except PaymentProvider.DoesNotExist:
            return Response(
                {"error": "Invalid payment provider"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получение метода оплаты, если указан
        payment_method = None
        if payment_method_id:
            try:
                payment_method = PaymentMethod.objects.get(pk=payment_method_id, user=user)
            except PaymentMethod.DoesNotExist:
                return Response(
                    {"error": "Invalid payment method"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Создание транзакции
        transaction = Transaction.objects.create(
            user=user,
            transaction_type='deposit',
            amount=amount,
            balance_before=user.balance,
            balance_after=user.balance,  # Будет обновлено после подтверждения
            status='pending',
            description=f"Deposit of {amount} via {payment_provider.name}",
            payment_method=payment_method
        )
        
        # Создание депозитной транзакции
        deposit = DepositTransaction.objects.create(
            user=user,
            amount=amount,
            payment_provider=payment_provider,
            payment_method=payment_method,
            transaction=transaction
        )
        
        try:
            # Используем фабрику для получения нужного процессора платежей
            from payments.integrations.factory import get_payment_processor
            
            payment_processor = get_payment_processor(payment_provider.provider_type)
            
            # Метаданные для платежа
            metadata = {
                "deposit_id": deposit.id,
                "transaction_id": str(deposit.transaction.transaction_id),
                "user_id": deposit.user.id
            }
            
            # Создаем платеж через общий интерфейс
            payment_result = payment_processor.create_payment(
                amount=deposit.amount,
                description=f"Deposit to Euro Lottery account",
                metadata=metadata
            )
            
            if not payment_result.get('success', False) and 'error' in payment_result:
                # Обработка ошибки
                raise ValueError(payment_result.get('error', 'Unknown payment error'))
            
            # Обновляем информацию о депозите
            deposit.provider_transaction_id = payment_result.get('id')
            deposit.provider_status = payment_result.get('status', 'pending')
            deposit.provider_response = payment_result
            deposit.save()
            
            # Регистрация активности пользователя
            UserActivity.objects.create(
                user=request.user,
                activity_type='initiate_deposit',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={
                    'amount': str(deposit.amount),
                    'provider': payment_provider.provider_type,
                    'transaction_id': str(deposit.transaction.transaction_id)
                }
            )
            
            # Формируем ответ в зависимости от провайдера
            if payment_provider.provider_type == 'stripe':
                return Response({
                    'client_secret': payment_result.get('client_secret'),
                    'transaction_id': deposit.transaction.transaction_id
                })
            elif payment_provider.provider_type == 'paypal':
                return Response({
                    'redirect_url': payment_result.get('approval_url'),
                    'transaction_id': deposit.transaction.transaction_id
                })
            else:
                # Общий случай
                return Response({
                    'payment_data': payment_result,
                    'transaction_id': deposit.transaction.transaction_id
                })
                
        except Exception as e:
            # Обработка любых ошибок
            deposit.transaction.status = 'failed'
            deposit.transaction.description = f"Failed deposit: {str(e)}"
            deposit.transaction.save()
            
            deposit.provider_status = 'failed'
            deposit.provider_response = {'error': str(e)}
            deposit.save()
            
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ConfirmDepositView(APIView):
    """Представление для подтверждения депозита"""
    permission_classes = (permissions.IsAuthenticated,)
    
    @transaction.atomic
    def post(self, request):
        transaction_id = request.data.get('transaction_id')
        payment_data = request.data
        
        if not transaction_id:
            return Response(
                {"error": "Transaction ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Получение транзакции
            transaction = Transaction.objects.get(
                transaction_id=transaction_id,
                user=request.user,
                transaction_type='deposit',
                status='pending'
            )
            
            # Получение депозитной транзакции
            deposit = DepositTransaction.objects.get(transaction=transaction)
            
            # Используем фабрику для получения нужного процессора платежей
            from payments.integrations.factory import get_payment_processor
            
            payment_processor = get_payment_processor(deposit.payment_provider.provider_type)
            
            # Получаем ID платежа в зависимости от провайдера
            if deposit.payment_provider.provider_type == 'stripe':
                payment_id = payment_data.get('payment_intent_id', deposit.provider_transaction_id)
            elif deposit.payment_provider.provider_type == 'paypal':
                payment_id = payment_data.get('paypal_order_id', deposit.provider_transaction_id)
            else:
                payment_id = deposit.provider_transaction_id
            
            # Подтверждаем платеж через интерфейс
            payment_result = payment_processor.confirm_payment(payment_id, payment_data)
            
            if not payment_result.get('success', False) and 'error' in payment_result:
                # Обработка ошибки
                raise ValueError(payment_result.get('error', 'Payment confirmation failed'))
            
            # Определяем статус платежа
            payment_status = payment_result.get('status', '').lower()
            
            if payment_status in ['succeeded', 'completed']:
                # Платеж успешен, обновляем транзакцию и баланс пользователя
                deposit.provider_status = payment_status
                deposit.provider_response = payment_result
                deposit.completed_at = timezone.now()
                deposit.save()
                
                transaction.status = 'completed'
                
                user = request.user
                user.balance += deposit.amount
                transaction.balance_after = user.balance
                
                transaction.save()
                user.save()
                
                # Регистрация активности пользователя
                UserActivity.objects.create(
                    user=user,
                    activity_type='deposit_completed',
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    details={
                        'amount': str(deposit.amount),
                        'provider': deposit.payment_provider.provider_type,
                        'transaction_id': str(transaction.transaction_id)
                    }
                )
                
                return Response({
                    'message': 'Deposit completed successfully',
                    'transaction_id': transaction.transaction_id,
                    'amount': deposit.amount,
                    'new_balance': user.balance
                })
                
            elif payment_status in ['canceled', 'cancelled']:
                # Платеж отменен
                deposit.provider_status = payment_status
                deposit.provider_response = payment_result
                deposit.save()
                
                transaction.status = 'cancelled'
                transaction.save()
                
                return Response({
                    'message': 'Deposit was canceled',
                    'transaction_id': transaction.transaction_id
                })
                
            else:
                # Платеж в процессе или другой статус
                deposit.provider_status = payment_status
                deposit.provider_response = payment_result
                deposit.save()
                
                return Response({
                    'message': 'Payment is still processing',
                    'status': payment_status,
                    'transaction_id': deposit.transaction.transaction_id
                })
                
        except Transaction.DoesNotExist:
            return Response(
                {"error": "Transaction not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except DepositTransaction.DoesNotExist:
            return Response(
                {"error": "Deposit transaction not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            # Обработка любых ошибок
            try:
                # Если транзакция и депозит найдены, обновляем их статус
                deposit.provider_status = 'failed'
                deposit.provider_response = {'error': str(e)}
                deposit.save()
                
                transaction.status = 'failed'
                transaction.description = f"Failed deposit: {str(e)}"
                transaction.save()
            except:
                pass
            
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class CancelDepositView(APIView):
    """Представление для отмены депозита"""
    permission_classes = (permissions.IsAuthenticated,)
    
    @transaction.atomic
    def post(self, request):
        transaction_id = request.data.get('transaction_id')
        
        if not transaction_id:
            return Response(
                {"error": "Transaction ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Получение транзакции
            transaction = Transaction.objects.get(
                transaction_id=transaction_id,
                user=request.user,
                transaction_type='deposit',
                status='pending'
            )
            
            # Получение депозитной транзакции
            deposit = DepositTransaction.objects.get(transaction=transaction)
            
            # Используем фабрику для получения нужного процессора платежей
            from payments.integrations.factory import get_payment_processor
            
            payment_processor = get_payment_processor(deposit.payment_provider.provider_type)
            
            # Получаем информацию о платеже
            payment_status = payment_processor.get_payment_status(deposit.provider_transaction_id)
            
            # Попытка отменить платеж через платежную систему
            payment_result = payment_processor.cancel_payment(deposit.provider_transaction_id)
            
            # Проверяем результат
            if not payment_result.get('success', False):
                error_msg = payment_result.get('error', f"Cannot cancel payment with status {payment_status.get('status')}")
                
                # Проверяем, не относится ли ошибка к уже завершенному или отмененному платежу
                current_status = payment_status.get('status', '').lower()
                if current_status in ['succeeded', 'completed', 'cancelled', 'canceled', 'failed']:
                    return Response(
                        {"error": error_msg},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    # Если это какая-то другая ошибка, но платеж не завершен, 
                    # все равно отменяем его в нашей системе
                    payment_result = {
                        'status': 'cancelled',
                        'success': True,
                        'message': 'Payment cancelled locally due to: ' + error_msg
                    }
            
            # Обновление депозитной транзакции
            deposit.provider_status = 'canceled'
            deposit.provider_response = payment_result
            deposit.save()
            
            # Обновление транзакции
            transaction.status = 'cancelled'
            transaction.save()
            
            # Регистрация активности пользователя
            UserActivity.objects.create(
                user=request.user,
                activity_type='deposit_cancelled',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={
                    'amount': str(deposit.amount),
                    'provider': deposit.payment_provider.provider_type,
                    'transaction_id': str(transaction.transaction_id)
                }
            )
            
            return Response({
                'message': 'Deposit cancelled successfully',
                'transaction_id': transaction.transaction_id
            })
                
        except Transaction.DoesNotExist:
            return Response(
                {"error": "Transaction not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except DepositTransaction.DoesNotExist:
            return Response(
                {"error": "Deposit transaction not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            # Обработка любых ошибок
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RequestWithdrawalView(APIView):
    """Представление для запроса на вывод средств"""
    permission_classes = (permissions.IsAuthenticated,)
    
    @transaction.atomic
    def post(self, request):
        serializer = WithdrawalRequestSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        amount = serializer.validated_data.get('amount')
        payment_method = serializer.validated_data.get('payment_method')
        
        # Проверка баланса
        if user.balance < amount:
            return Response(
                {"error": "Insufficient funds"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Создание транзакции
        transaction = Transaction.objects.create(
            user=user,
            transaction_type='withdrawal',
            amount=amount,
            balance_before=user.balance,
            balance_after=user.balance - amount,  # Резервируем средства
            status='pending',
            description=f"Withdrawal of {amount}",
            payment_method=payment_method
        )
        
        # Обновление баланса пользователя
        user.balance -= amount
        user.save()
        
        # Создание запроса на вывод средств
        withdrawal = WithdrawalRequest.objects.create(
            user=user,
            amount=amount,
            payment_method=payment_method,
            transaction=transaction
        )
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=user,
            activity_type='withdrawal_request',
            ip_address=self._get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={
                'amount': str(amount),
                'payment_method': payment_method.method_type,
                'transaction_id': str(transaction.transaction_id)
            }
        )
        
        return Response({
            'message': 'Withdrawal request submitted successfully',
            'withdrawal_id': withdrawal.id,
            'transaction_id': transaction.transaction_id,
            'status': 'pending',
            'amount': amount,
            'current_balance': user.balance
        }, status=status.HTTP_201_CREATED)
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class WithdrawalStatusView(generics.RetrieveAPIView):
    """Представление для просмотра статуса запроса на вывод средств"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = WithdrawalRequestSerializer
    
    def get_queryset(self):
        return WithdrawalRequest.objects.filter(user=self.request.user)


class CancelWithdrawalView(APIView):
    """Представление для отмены запроса на вывод средств"""
    permission_classes = (permissions.IsAuthenticated,)
    
    @transaction.atomic
    def post(self, request, pk):
        try:
            # Получение запроса на вывод средств
            withdrawal = WithdrawalRequest.objects.get(
                pk=pk,
                user=request.user,
                status='pending'
            )
            
            # Получение транзакции
            transaction = withdrawal.transaction
            
            # Возврат средств пользователю
            user = request.user
            user.balance += withdrawal.amount
            user.save()
            
            # Обновление статуса запроса и транзакции
            withdrawal.status = 'cancelled'
            withdrawal.save()
            
            transaction.status = 'cancelled'
            transaction.balance_after = user.balance
            transaction.description = f"Cancelled withdrawal of {withdrawal.amount}"
            transaction.save()
            
            # Регистрация активности пользователя
            UserActivity.objects.create(
                user=user,
                activity_type='withdrawal_cancelled',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={
                    'amount': str(withdrawal.amount),
                    'withdrawal_id': withdrawal.id,
                    'transaction_id': str(transaction.transaction_id)
                }
            )
            
            return Response({
                'message': 'Withdrawal request cancelled successfully',
                'amount_returned': withdrawal.amount,
                'current_balance': user.balance
            })
            
        except WithdrawalRequest.DoesNotExist:
            return Response(
                {"error": "Withdrawal request not found or already processed"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class WebhookBaseView(APIView):
    """Базовый класс для обработки webhook-уведомлений от платежных систем"""
    permission_classes = (permissions.AllowAny,)
    
    @transaction.atomic
    def process_webhook(self, request, provider_type):
        """
        Обрабатывает webhook-запрос от платежного провайдера
        
        Args:
            request: HTTP запрос
            provider_type: Тип платежного провайдера (stripe, paypal)
            
        Returns:
            HTTP ответ
        """
        try:
            # Используем фабрику для получения процессора платежей
            from payments.integrations.factory import get_payment_processor
            payment_processor = get_payment_processor(provider_type)
            
            # Получаем заголовки и тело запроса
            headers = request.headers
            # Преобразуем тело запроса в JSON, если это еще не сделано
            try:
                if isinstance(request.body, bytes):
                    body = json.loads(request.body.decode('utf-8'))
                else:
                    body = json.loads(request.body)
            except json.JSONDecodeError:
                body = request.body
            
            # Парсим webhook с помощью процессора
            webhook_data = payment_processor.parse_webhook(body, headers)
            
            # Проверяем результат парсинга
            if not webhook_data.get('success', False):
                return Response(
                    {"error": webhook_data.get('error', 'Failed to parse webhook')},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Получаем тип события и данные
            event_type = webhook_data.get('type')
            event_data = webhook_data.get('data', {})
            
            # Обрабатываем событие
            if payment_processor.handle_webhook_event(event_type, event_data):
                # Если событие успешно обработано процессором, 
                # дополнительно обновляем статус транзакции в нашей БД
                self._update_transaction_status(event_type, event_data, provider_type)
                return Response(status=status.HTTP_200_OK)
            else:
                # Если событие не обработано, просто возвращаем успешный статус
                # (webhook всегда должен отвечать 200 OK, чтобы не вызывать повторных отправок)
                return Response(status=status.HTTP_200_OK)
                
        except Exception as e:
            # Логируем ошибку, но возвращаем 200 OK
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error processing {provider_type} webhook: {str(e)}")
            return Response(status=status.HTTP_200_OK)
    
    def _update_transaction_status(self, event_type, event_data, provider_type):
        """
        Обновляет статус транзакции в нашей системе на основе события webhook
        
        Args:
            event_type: Тип события webhook
            event_data: Данные события
            provider_type: Тип платежного провайдера
        """
        # Получаем ID платежа из данных события
        payment_id = None
        
        # Извлекаем ID платежа в зависимости от типа провайдера и события
        if provider_type == 'stripe':
            if event_type == 'payment_intent.succeeded':
                payment_id = event_data.get('id')
            elif event_type == 'payment_intent.payment_failed':
                payment_id = event_data.get('id')
        elif provider_type == 'paypal':
            if event_type == 'PAYMENT.CAPTURE.COMPLETED':
                payment_id = event_data.get('id')
            elif event_type == 'PAYMENT.CAPTURE.DENIED':
                payment_id = event_data.get('id')
        
        # Если ID платежа найден, обновляем транзакцию
        if payment_id:
            try:
                # Найти депозитную транзакцию
                deposit = DepositTransaction.objects.get(provider_transaction_id=payment_id)
                
                # Обновить статус в зависимости от типа события
                if event_type in ['payment_intent.succeeded', 'PAYMENT.CAPTURE.COMPLETED']:
                    # Платеж успешен
                    
                    # Если транзакция уже обработана, игнорируем
                    if deposit.transaction.status == 'completed':
                        return
                    
                    # Обновление депозитной транзакции
                    deposit.provider_status = 'succeeded'
                    deposit.provider_response = event_data
                    deposit.completed_at = timezone.now()
                    deposit.save()
                    
                    # Обновление транзакции и баланса пользователя
                    transaction = deposit.transaction
                    transaction.status = 'completed'
                    
                    user = transaction.user
                    user.balance += deposit.amount
                    transaction.balance_after = user.balance
                    
                    transaction.save()
                    user.save()
                    
                elif event_type in ['payment_intent.payment_failed', 'PAYMENT.CAPTURE.DENIED']:
                    # Платеж неудачен
                    
                    # Если транзакция уже обработана, игнорируем
                    if deposit.transaction.status in ['failed', 'cancelled']:
                        return
                    
                    # Обновление депозитной транзакции
                    deposit.provider_status = 'failed'
                    deposit.provider_response = event_data
                    deposit.save()
                    
                    # Обновление транзакции
                    transaction = deposit.transaction
                    transaction.status = 'failed'
                    
                    # Получаем сообщение об ошибке в зависимости от провайдера
                    if provider_type == 'stripe':
                        error_msg = event_data.get('last_payment_error', {}).get('message', 'Payment failed')
                    else:
                        error_msg = 'Payment failed'
                        
                    transaction.description = f"Failed deposit: {error_msg}"
                    transaction.save()
                
            except DepositTransaction.DoesNotExist:
                # Транзакция не найдена, возможно, это не наш платеж
                pass


class StripeWebhookView(WebhookBaseView):
    """Webhook для получения уведомлений от Stripe"""
    
    def post(self, request):
        """Обработка webhook-запроса от Stripe"""
        return self.process_webhook(request, 'stripe')


class PayPalWebhookView(WebhookBaseView):
    """Webhook для получения уведомлений от PayPal"""
    
    def post(self, request):
        """Обработка webhook-запроса от PayPal"""
        return self.process_webhook(request, 'paypal')


class CryptoWebhookView(WebhookBaseView):
    """Webhook для получения уведомлений от криптовалютных платежных систем"""
    
    def post(self, request):
        """Обработка webhook-запроса от CoinPayments"""
        return self.process_webhook(request, 'crypto')


class PaymentMethodsAPIView(APIView):
    """API представление для получения списка доступных методов оплаты"""
    
    def get(self, request):
        """
        Возвращает список всех доступных методов оплаты для клиентской части.
        Включает информацию о платежных системах и их конфигурацию.
        """
        from payments.integrations.factory import get_available_payment_methods, get_processor_config
        
        # Получаем доступные методы оплаты
        payment_methods = get_available_payment_methods()
        
        # Получаем конфигурации процессоров для клиентской части
        processor_config = get_processor_config()
        
        # Получаем активные платежные провайдеры из БД
        active_providers = PaymentProvider.objects.filter(is_active=True).values('id', 'name', 'provider_type', 'logo')
        
        response_data = {
            'methods': payment_methods,
            'providers': [provider for provider in active_providers],
            'config': processor_config
        }
        
        return Response(response_data)