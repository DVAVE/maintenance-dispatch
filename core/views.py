from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework.generics import ListAPIView
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator

from core.serializers import (
    UserSerializer,
    MaintenanceRequestSerializer,
    StaffStatusUpdateSerializer,
)
from core.permissions import (
    IsPropertyManager,
    IsMaintenanceStaff,
    IsResident,
    IsOwnerOrManager,
    IsAssignedStaffOrManager,
)
from core.models import MaintenanceRequest


# ---------------------------------------------------------------------------
# Auth views
# ---------------------------------------------------------------------------

class CSRFTokenView(APIView):
    permission_classes = []

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({'message': 'CSRF cookie set'}, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = []

    @method_decorator(csrf_protect)
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response(UserSerializer(user).data, status=status.HTTP_200_OK)
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# MaintenanceRequest ViewSet
# ---------------------------------------------------------------------------

class MaintenanceRequestViewSet(viewsets.ModelViewSet):
    serializer_class = MaintenanceRequestSerializer

    # ── Queryset filtered by role ──────────────────────────────────────────
    def get_queryset(self):
        try:
            role = self.request.user.profile.role
            if role == 'manager':
                return MaintenanceRequest.objects.all().order_by('-created_at')
            elif role == 'staff':
                return MaintenanceRequest.objects.filter(
                    assigned_to=self.request.user
                ).order_by('-created_at')
            elif role == 'resident':
                return MaintenanceRequest.objects.filter(
                    created_by=self.request.user
                ).order_by('-created_at')
        except Exception:
            pass
        return MaintenanceRequest.objects.none()

    # ── Permission class per action ────────────────────────────────────────
    def get_permissions(self):
        if self.action == 'create':
            return [IsResident()]
        elif self.action == 'assign':
            return [IsPropertyManager()]
        elif self.action in ['partial_update', 'update']:
            # OR: staff can update status; manager can update anything
            return [(IsMaintenanceStaff | IsPropertyManager)()]
        elif self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action == 'destroy':
            return [IsPropertyManager()]
        return [IsAuthenticated()]

    # ── Serializer class per action / role ────────────────────────────────
    def get_serializer_class(self):
        if self.action == 'partial_update':
            try:
                if self.request.user.profile.role == 'staff':
                    return StaffStatusUpdateSerializer
            except Exception:
                pass
        return MaintenanceRequestSerializer

    # ── Auto-set created_by on create ─────────────────────────────────────
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # ── Strip all fields except status for staff PATCH requests ───────────
    def partial_update(self, request, *args, **kwargs):
        try:
            if request.user.profile.role == 'staff':
                filtered_data = {'status': request.data.get('status')}
                instance = self.get_object()
                serializer = self.get_serializer(instance, data=filtered_data, partial=True)
                serializer.is_valid(raise_exception=True)
                self.perform_update(serializer)
                return Response(MaintenanceRequestSerializer(instance).data)
        except Exception:
            pass
        return super().partial_update(request, *args, **kwargs)

    # ── Assign action ──────────────────────────────────────────────────────
    @action(detail=True, methods=['post'], url_path='assign')
    def assign(self, request, pk=None):
        maintenance_request = self.get_object()

        if maintenance_request.status != 'Pending':
            return Response(
                {'error': 'Only Pending requests can be assigned.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        staff_user_id = request.data.get('staff_user_id')
        try:
            staff_user = User.objects.get(id=staff_user_id)
            if staff_user.profile.role != 'staff':
                return Response(
                    {'error': 'Selected user is not a Maintenance Staff member.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {'error': 'Selected user is not a Maintenance Staff member.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        maintenance_request.assigned_to = staff_user
        maintenance_request.save()
        serializer = MaintenanceRequestSerializer(
            maintenance_request, context={'request': request}
        )
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Staff user list (for manager assign dropdown)
# ---------------------------------------------------------------------------

class StaffUserListView(ListAPIView):
    permission_classes = [IsPropertyManager]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.filter(profile__role='staff')
