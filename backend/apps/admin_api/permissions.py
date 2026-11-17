"""
Who may use the dashboard API.

Every endpoint requires an active staff account (IsStaff). Model endpoints
additionally check Django's per-model permissions (view / add / change /
delete), the same ones the Django admin uses, so an administrator can give a
member of staff access to some sections only. Superusers pass every check.
"""

from rest_framework.permissions import BasePermission, DjangoModelPermissions


class IsStaff(BasePermission):
    message = "Only staff accounts can use the dashboard."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.is_active and user.is_staff)


class StaffModelPermissions(DjangoModelPermissions):
    """DjangoModelPermissions, but reading also requires the `view` permission."""

    perms_map = {
        **DjangoModelPermissions.perms_map,
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "HEAD": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": ["%(app_label)s.view_%(model_name)s"],
    }

    def has_permission(self, request, view) -> bool:
        user = request.user
        if request.method in ("GET", "HEAD", "OPTIONS") and user and user.is_authenticated:
            # Anyone allowed to change records may also see them.
            model = self._queryset(view).model
            opts = model._meta
            if user.has_perm(f"{opts.app_label}.change_{opts.model_name}"):
                return True
        return super().has_permission(request, view)


class IsSuperuser(BasePermission):
    message = "Only administrators can manage staff accounts."

    def has_permission(self, request, view) -> bool:
        return bool(request.user and request.user.is_superuser)
