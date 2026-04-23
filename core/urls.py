from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CSRFTokenView,
    LoginView,
    LogoutView,
    MeView,
    MaintenanceRequestViewSet,
    StaffUserListView,
)

router = DefaultRouter()
router.register(r'requests', MaintenanceRequestViewSet, basename='maintenancerequest')

urlpatterns = [
    # Auth endpoints
    path('auth/csrf/', CSRFTokenView.as_view(), name='csrf'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),
    # Staff user list
    path('users/staff/', StaffUserListView.as_view(), name='staff-users'),
    # MaintenanceRequest CRUD + assign
    path('', include(router.urls)),
]
