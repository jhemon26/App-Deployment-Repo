from rest_framework.permissions import BasePermission


class IsActiveAndNotBlocked(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and not getattr(user, 'is_blocked', False)
        )


class IsApprovedBusinessUser(BasePermission):
    """
    Business actions must be blocked for unapproved doctor/pharmacy accounts.
    Admin and general users are allowed by this gate.
    """

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if getattr(user, 'is_blocked', False) or not user.is_active:
            return False
        if user.role in ('doctor', 'pharmacy'):
            return bool(getattr(user, 'is_approved', False))
        return True


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsDoctor(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'doctor'


class IsPharmacy(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'pharmacy'


class IsGeneral(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'general'


class IsApproved(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_approved


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'patient'):
            return obj.patient == request.user
        if hasattr(obj, 'doctor'):
            return obj.doctor == request.user
        return obj == request.user
