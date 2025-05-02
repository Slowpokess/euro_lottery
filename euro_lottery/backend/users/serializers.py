from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.utils.translation import gettext_lazy as _
from .models import UserDocument, UserActivity, ReferralCode, Referral

User = get_user_model()


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Сериализатор для регистрации новых пользователей"""
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    referral_code = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ('email', 'username', 'password', 'password_confirm', 'first_name', 'last_name', 'date_of_birth', 'phone_number', 'referral_code')
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError(_("Passwords don't match"))
        
        # Проверка возраста
        if 'date_of_birth' in data and data['date_of_birth']:
            from datetime import date
            today = date.today()
            age = today.year - data['date_of_birth'].year - ((today.month, today.day) < (data['date_of_birth'].month, data['date_of_birth'].day))
            if age < 18:
                raise serializers.ValidationError(_("You must be at least 18 years old to register"))
        
        return data
    
    def create(self, validated_data):
        referral_code = validated_data.pop('referral_code', None)
        
        user = User.objects.create_user(**validated_data)
        
        # Обработка реферального кода
        if referral_code:
            try:
                ref_code_obj = ReferralCode.objects.get(code=referral_code)
                Referral.objects.create(
                    referrer=ref_code_obj.user,
                    referred_user=user
                )
            except ReferralCode.DoesNotExist:
                pass
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """Сериализатор для авторизации пользователей"""
    email = serializers.EmailField()
    password = serializers.CharField(style={'input_type': 'password'})
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError(_("Invalid login credentials"))
            if not user.is_active:
                raise serializers.ValidationError(_("User account is disabled"))
            if not user.is_verified:
                raise serializers.ValidationError(_("Email is not verified"))
        else:
            raise serializers.ValidationError(_("Must include email and password"))
        
        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    """Сериализатор для просмотра и редактирования профиля пользователя"""
    class Meta:
        model = User
        fields = ('id', 'email', 'username', 'first_name', 'last_name', 'date_of_birth', 
                  'phone_number', 'is_verified', 'is_2fa_enabled', 'balance', 
                  'email_notifications', 'sms_notifications', 'push_notifications',
                  'daily_limit', 'weekly_limit', 'monthly_limit', 'kyc_status')
        read_only_fields = ('id', 'email', 'balance', 'is_verified', 'kyc_status')


class ChangePasswordSerializer(serializers.Serializer):
    """Сериализатор для изменения пароля"""
    old_password = serializers.CharField(required=True, style={'input_type': 'password'})
    new_password = serializers.CharField(required=True, min_length=8, style={'input_type': 'password'})
    confirm_password = serializers.CharField(required=True, min_length=8, style={'input_type': 'password'})
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError(_("New passwords don't match"))
        return data


class UserDocumentSerializer(serializers.ModelSerializer):
    """Сериализатор для документов пользователя (KYC)"""
    class Meta:
        model = UserDocument
        fields = ('id', 'document_type', 'document_file', 'uploaded_at', 'is_verified')
        read_only_fields = ('id', 'uploaded_at', 'is_verified')


class UserActivitySerializer(serializers.ModelSerializer):
    """Сериализатор для активности пользователя"""
    class Meta:
        model = UserActivity
        fields = ('id', 'activity_type', 'ip_address', 'created_at', 'details')
        read_only_fields = fields


class ReferralCodeSerializer(serializers.ModelSerializer):
    """Сериализатор для реферального кода пользователя"""
    class Meta:
        model = ReferralCode
        fields = ('code', 'created_at')
        read_only_fields = fields


class ReferralSerializer(serializers.ModelSerializer):
    """Сериализатор для рефералов пользователя"""
    referred_user_email = serializers.EmailField(source='referred_user.email', read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    
    class Meta:
        model = Referral
        fields = ('id', 'referred_user_email', 'created_at', 'bonus_paid')
        read_only_fields = fields


class ResponsibleGamingLimitsSerializer(serializers.Serializer):
    """Сериализатор для лимитов ответственной игры"""
    daily_limit = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    weekly_limit = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)
    monthly_limit = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)


class SelfExclusionSerializer(serializers.Serializer):
    """Сериализатор для самоисключения пользователя"""
    self_exclusion_end_date = serializers.DateField(required=True)
    
    def validate_self_exclusion_end_date(self, value):
        from datetime import date
        if value <= date.today():
            raise serializers.ValidationError(_("End date must be in the future"))
        return value