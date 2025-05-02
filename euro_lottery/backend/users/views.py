from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
from django.core.mail import send_mail
from django.conf import settings
import uuid
import datetime

from .models import UserDocument, UserActivity, ReferralCode, Referral
from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer,
    ChangePasswordSerializer, UserDocumentSerializer, UserActivitySerializer,
    ReferralCodeSerializer, ReferralSerializer, ResponsibleGamingLimitsSerializer,
    SelfExclusionSerializer
)

User = get_user_model()


class UserRegistrationView(generics.CreateAPIView):
    """Представление для регистрации новых пользователей"""
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Создание токена верификации и отправка письма
        verification_token = str(uuid.uuid4())
        user.verification_token = verification_token
        user.save()
        
        verification_url = f"{request.scheme}://{request.get_host()}/api/users/verify-email/{verification_token}/"
        
        send_mail(
            'Verify your Euro Lottery account',
            f'Please click the link to verify your account: {verification_url}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        # Создание реферального кода для пользователя
        code = get_random_string(length=8).upper()
        ReferralCode.objects.create(user=user, code=code)
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=user,
            activity_type='registration',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={}
        )
        
        # Формирование ответа
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserProfileSerializer(user).data,
            'message': 'A verification email has been sent to your email address.'
        }, status=status.HTTP_201_CREATED)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserLoginView(generics.GenericAPIView):
    """Представление для авторизации пользователей"""
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserLoginSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=user,
            activity_type='login',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={}
        )
        
        # Формирование ответа
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserProfileSerializer(user).data
        })
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserLogoutView(APIView):
    """Представление для выхода пользователя"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Blacklist the token to prevent reuse
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Регистрация активности пользователя
            UserActivity.objects.create(
                user=request.user,
                activity_type='logout',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={
                    'logout_method': 'manual',
                    'token_blacklisted': True
                }
            )
            
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            # Log the error but don't expose details to user
            print(f"Logout error: {str(e)}")
            return Response({"error": "Could not log out properly"}, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserProfileView(generics.RetrieveAPIView):
    """Представление для просмотра профиля пользователя"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        return self.request.user


class UserProfileUpdateView(generics.UpdateAPIView):
    """Представление для обновления профиля пользователя"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserProfileSerializer
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=request.user,
            activity_type='profile_update',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={'updated_fields': list(request.data.keys())}
        )
        
        return Response(serializer.data)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ChangePasswordView(generics.GenericAPIView):
    """Представление для изменения пароля"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ChangePasswordSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({"old_password": ["Wrong password."]}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=user,
            activity_type='password_change',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={}
        )
        
        return Response({"message": "Password updated successfully."}, status=status.HTTP_200_OK)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class VerifyEmailView(APIView):
    """Представление для верификации email"""
    permission_classes = (permissions.AllowAny,)
    
    def get(self, request, token):
        try:
            user = User.objects.get(verification_token=token)
            user.is_verified = True
            user.verification_token = None
            user.save()
            
            # Регистрация активности пользователя
            UserActivity.objects.create(
                user=user,
                activity_type='email_verification',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={}
            )
            
            return Response({"message": "Email successfully verified."}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({"error": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class ResendVerificationView(APIView):
    """Представление для повторной отправки письма верификации"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        user = request.user
        
        if user.is_verified:
            return Response({"message": "Email already verified."}, status=status.HTTP_200_OK)
        
        # Создание нового токена верификации
        verification_token = str(uuid.uuid4())
        user.verification_token = verification_token
        user.save()
        
        verification_url = f"{request.scheme}://{request.get_host()}/api/users/verify-email/{verification_token}/"
        
        send_mail(
            'Verify your Euro Lottery account',
            f'Please click the link to verify your account: {verification_url}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )
        
        return Response({"message": "Verification email has been sent."}, status=status.HTTP_200_OK)


class UploadDocumentView(generics.CreateAPIView):
    """Представление для загрузки документов (KYC)"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserDocumentSerializer
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
        # Обновление статуса KYC пользователя, если он ещё не верифицирован
        user = self.request.user
        if user.kyc_status == 'not_started':
            user.kyc_status = 'pending'
            user.save()
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=user,
            activity_type='document_upload',
            ip_address=self.get_client_ip(self.request),
            user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
            details={'document_type': serializer.validated_data['document_type']}
        )
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class KYCStatusView(generics.RetrieveAPIView):
    """Представление для просмотра статуса KYC"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        user = request.user
        documents = UserDocument.objects.filter(user=user)
        
        return Response({
            'kyc_status': user.kyc_status,
            'documents': UserDocumentSerializer(documents, many=True).data
        })


class ReferralsListView(generics.ListAPIView):
    """Представление для просмотра списка рефералов"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ReferralSerializer
    
    def get_queryset(self):
        return Referral.objects.filter(referrer=self.request.user)


class ReferralCodeView(generics.RetrieveAPIView):
    """Представление для просмотра реферального кода"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ReferralCodeSerializer
    
    def get_object(self):
        try:
            return ReferralCode.objects.get(user=self.request.user)
        except ReferralCode.DoesNotExist:
            # Если по какой-то причине у пользователя нет реферального кода, создаем его
            code = get_random_string(length=8).upper()
            return ReferralCode.objects.create(user=self.request.user, code=code)


class ResponsibleGamingLimitsView(generics.GenericAPIView):
    """Представление для управления лимитами ответственной игры"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ResponsibleGamingLimitsSerializer
    
    def get(self, request):
        user = request.user
        return Response({
            'daily_limit': user.daily_limit,
            'weekly_limit': user.weekly_limit,
            'monthly_limit': user.monthly_limit,
        })
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # Лимиты можно только уменьшать, но не увеличивать
        new_daily_limit = serializer.validated_data['daily_limit']
        new_weekly_limit = serializer.validated_data['weekly_limit']
        new_monthly_limit = serializer.validated_data['monthly_limit']
        
        if new_daily_limit > user.daily_limit:
            return Response({"daily_limit": ["You can only decrease your daily limit."]}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        if new_weekly_limit > user.weekly_limit:
            return Response({"weekly_limit": ["You can only decrease your weekly limit."]}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        if new_monthly_limit > user.monthly_limit:
            return Response({"monthly_limit": ["You can only decrease your monthly limit."]}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        user.daily_limit = new_daily_limit
        user.weekly_limit = new_weekly_limit
        user.monthly_limit = new_monthly_limit
        user.save()
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=user,
            activity_type='limits_update',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={
                'daily_limit': str(new_daily_limit),
                'weekly_limit': str(new_weekly_limit),
                'monthly_limit': str(new_monthly_limit)
            }
        )
        
        return Response({
            'message': 'Limits updated successfully.',
            'daily_limit': user.daily_limit,
            'weekly_limit': user.weekly_limit,
            'monthly_limit': user.monthly_limit,
        })
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SelfExclusionView(generics.GenericAPIView):
    """Представление для самоисключения из игры"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = SelfExclusionSerializer
    
    def get(self, request):
        user = request.user
        return Response({
            'is_self_excluded': user.is_self_excluded,
            'self_exclusion_end_date': user.self_exclusion_end_date,
        })
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.is_self_excluded = True
        user.self_exclusion_end_date = serializer.validated_data['self_exclusion_end_date']
        user.save()
        
        # Регистрация активности пользователя
        UserActivity.objects.create(
            user=user,
            activity_type='self_exclusion',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            details={'self_exclusion_end_date': str(user.self_exclusion_end_date)}
        )
        
        return Response({
            'message': 'Self-exclusion successfully applied.',
            'is_self_excluded': user.is_self_excluded,
            'self_exclusion_end_date': user.self_exclusion_end_date,
        })
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserActivityView(generics.ListAPIView):
    """Представление для просмотра активности пользователя"""
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserActivitySerializer
    
    def get_queryset(self):
        return UserActivity.objects.filter(user=self.request.user).order_by('-created_at')


class SecureTokenRefreshView(TokenRefreshView):
    """
    Расширенное представление для обновления токенов с улучшенной безопасностью и логированием
    """
    def post(self, request, *args, **kwargs):
        serializer = TokenRefreshSerializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            # Регистрируем неудачные попытки обновления токена
            user = self._get_user_from_token(request.data.get('refresh', ''))
            if user:
                UserActivity.objects.create(
                    user=user,
                    activity_type='token_refresh_failed',
                    ip_address=self._get_client_ip(request),
                    user_agent=request.META.get('HTTP_USER_AGENT', ''),
                    details={'error': str(e)}
                )
            raise InvalidToken(e.args[0])
        
        # Если валидация успешна, получаем данные из сериализатора
        data = serializer.validated_data
        
        # Получаем пользователя из токена
        user = self._get_user_from_token(request.data.get('refresh', ''))
        
        # Регистрируем успешное обновление токена
        if user:
            UserActivity.objects.create(
                user=user,
                activity_type='token_refresh_success',
                ip_address=self._get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                details={}
            )
        
        return Response(data, status=status.HTTP_200_OK)
    
    def _get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _get_user_from_token(self, token):
        """Безопасно извлекает пользователя из refresh токена"""
        try:
            refresh = RefreshToken(token)
            user_id = refresh.payload.get('user_id')
            if user_id:
                User = get_user_model()
                return User.objects.filter(id=user_id).first()
        except Exception:
            pass
        return None