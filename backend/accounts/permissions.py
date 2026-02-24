from rest_framework.permissions import BasePermission


class IsActiveAuthenticated(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and not getattr(user, "is_deleted", False))


class IsAdminUserRole(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and not getattr(user, "is_deleted", False)
            and (user.is_staff or user.is_superuser)
        )


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        return obj == user or user.is_staff or user.is_superuser
