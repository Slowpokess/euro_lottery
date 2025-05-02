from django.urls import path
from . import views

urlpatterns = [
    # Аутентификация
    path('register/', views.UserRegistrationView.as_view(), name='register'),
    path('login/', views.UserLoginView.as_view(), name='login'),
    path('token/refresh/', views.SecureTokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.UserLogoutView.as_view(), name='logout'),
    
    # Профиль пользователя
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('profile/update/', views.UserProfileUpdateView.as_view(), name='profile-update'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Верификация
    path('verify-email/<str:token>/', views.VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', views.ResendVerificationView.as_view(), name='resend-verification'),
    
    # KYC
    path('kyc/upload-document/', views.UploadDocumentView.as_view(), name='upload-document'),
    path('kyc/status/', views.KYCStatusView.as_view(), name='kyc-status'),
    
    # Реферальная система
    path('referrals/', views.ReferralsListView.as_view(), name='referrals-list'),
    path('referral-code/', views.ReferralCodeView.as_view(), name='referral-code'),
    
    # Настройки ответственной игры
    path('responsible-gaming/limits/', views.ResponsibleGamingLimitsView.as_view(), name='gaming-limits'),
    path('responsible-gaming/self-exclusion/', views.SelfExclusionView.as_view(), name='self-exclusion'),
    
    # История активности
    path('activity/', views.UserActivityView.as_view(), name='user-activity'),
]