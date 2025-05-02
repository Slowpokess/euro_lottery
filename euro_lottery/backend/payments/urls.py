from django.urls import path
from . import views

urlpatterns = [
    # Транзакции
    path('transactions/', views.TransactionListView.as_view(), name='transactions-list'),
    path('transactions/<uuid:transaction_id>/', views.TransactionDetailView.as_view(), name='transaction-detail'),
    
    # Методы оплаты
    path('payment-methods/', views.PaymentMethodListView.as_view(), name='payment-methods-list'),
    path('payment-methods/add/', views.AddPaymentMethodView.as_view(), name='add-payment-method'),
    path('payment-methods/<int:pk>/delete/', views.DeletePaymentMethodView.as_view(), name='delete-payment-method'),
    path('payment-methods/<int:pk>/set-default/', views.SetDefaultPaymentMethodView.as_view(), name='set-default-payment-method'),
    
    # Депозиты
    path('deposit/initiate/', views.InitiateDepositView.as_view(), name='initiate-deposit'),
    path('deposit/confirm/', views.ConfirmDepositView.as_view(), name='confirm-deposit'),
    path('deposit/cancel/', views.CancelDepositView.as_view(), name='cancel-deposit'),
    
    # Вывод средств
    path('withdrawal/request/', views.RequestWithdrawalView.as_view(), name='request-withdrawal'),
    path('withdrawal/status/<int:pk>/', views.WithdrawalStatusView.as_view(), name='withdrawal-status'),
    path('withdrawal/cancel/<int:pk>/', views.CancelWithdrawalView.as_view(), name='cancel-withdrawal'),
    
    # Webhooks для платежных систем
    path('webhooks/stripe/', views.StripeWebhookView.as_view(), name='stripe-webhook'),
    path('webhooks/paypal/', views.PayPalWebhookView.as_view(), name='paypal-webhook'),
    path('webhooks/crypto/', views.CryptoWebhookView.as_view(), name='crypto-webhook'),
    
    # API для получения доступных методов оплаты
    path('methods/', views.PaymentMethodsAPIView.as_view(), name='payment-methods-api'),
]