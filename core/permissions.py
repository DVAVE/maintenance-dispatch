from rest_framework.permissions import BasePermission


class IsPropertyManager(BasePermission):
    message = 'Access restricted to Property Managers only.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return request.user.profile.role == 'manager'
        except Exception:
            return False


class IsMaintenanceStaff(BasePermission):
    message = 'Access restricted to Maintenance Staff only.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return request.user.profile.role == 'staff'
        except Exception:
            return False


class IsResident(BasePermission):
    message = 'Access restricted to Residents only.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        try:
            return request.user.profile.role == 'resident'
        except Exception:
            return False


class IsOwnerOrManager(BasePermission):
    message = 'You do not have permission to access this request.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        try:
            if request.user.profile.role == 'manager':
                return True
            return obj.created_by == request.user
        except Exception:
            return False


class IsAssignedStaffOrManager(BasePermission):
    message = 'You can only access requests assigned to you.'

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        try:
            if request.user.profile.role == 'manager':
                return True
            return obj.assigned_to == request.user
        except Exception:
            return False
