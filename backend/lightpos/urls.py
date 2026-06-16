from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from apps.staff.views import StaffTokenObtainView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/login/',   StaffTokenObtainView.as_view()),
    path('api/auth/refresh/', TokenRefreshView.as_view()),
    path('api/staff/',         include('apps.staff.urls')),
    path('api/menu/',          include('apps.menu.urls')),
    path('api/tables/',        include('apps.tables.urls')),
    path('api/orders/',        include('apps.orders.urls')),
    path('api/inventory/',     include('apps.inventory.urls')),
    path('api/analytics/',     include('apps.analytics.urls')),
    path('api/customers/',     include('apps.customers.urls')),
    path('api/locations/',     include('apps.locations.urls')),
    path('api/subscriptions/', include('apps.subscriptions.urls')),
    path('api/delivery/',      include('apps.delivery.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
