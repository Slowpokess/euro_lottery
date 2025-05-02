from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
# Импорты для Swagger/ReDoc документации
# type: ignore
from drf_yasg.views import get_schema_view
# type: ignore
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="Euro Lottery API",
      default_version='v1',
      description="API documentation for the Euro Lottery application",
      contact=openapi.Contact(email="admin@eurolottery.com"),
      license=openapi.License(name="Proprietary"),
   ),
   public=True,
   permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/lottery/', include('lottery.urls')),
    path('api/payments/', include('payments.urls')),
    
    # Swagger/ReDoc documentation
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
]

# Добавляем URL-ы для статических и медиа файлов в развитии
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)