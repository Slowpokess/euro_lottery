# This file is used only by IDE for type checking and imports resolution
# It will not be used in runtime

# Import modules that your IDE might not be able to find
try:
    import stripe
    import rest_framework_simplejwt.tokens
    import rest_framework_simplejwt.views
    from rest_framework_simplejwt.tokens import RefreshToken
    from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
except ImportError:
    pass