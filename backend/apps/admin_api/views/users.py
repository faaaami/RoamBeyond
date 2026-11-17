"""
Staff accounts and roles. Administrators (superusers) only.

    /api/admin/users/            ?q=&active=&role=<id>&ordering=
    /api/admin/roles/            GET: roles to assign (Django groups)
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db.models import Count
from rest_framework import status
from rest_framework.response import Response
from rest_framework.viewsets import ReadOnlyModelViewSet

from apps.core.exceptions import ApiError

from ..base import StaffAPIMixin, StaffModelViewSet
from ..permissions import IsStaff, IsSuperuser
from ..serializers.users import RoleSerializer, StaffAccountSerializer


class StaffAccountViewSet(StaffModelViewSet):
    permission_classes = [IsStaff, IsSuperuser]
    queryset = get_user_model()._default_manager.filter(is_staff=True).prefetch_related("groups")
    serializer_class = StaffAccountSerializer
    search_fields = ("username", "email", "first_name", "last_name")
    filter_fields = {"active": "is_active", "role": "groups", "administrator": "is_superuser"}
    ordering_fields = ("username", "first_name", "email", "last_login", "date_joined")
    ordering = ("first_name", "username")

    def destroy(self, request, *args, **kwargs):
        if self.get_object().pk == request.user.pk:
            raise ApiError(
                "You cannot delete your own account.",
                code="forbidden",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)


class RoleViewSet(StaffAPIMixin, ReadOnlyModelViewSet):
    permission_classes = [IsStaff, IsSuperuser]
    queryset = (
        Group.objects.annotate(member_count=Count("user"))
        .prefetch_related("permissions__content_type")
        .order_by("name")
    )
    serializer_class = RoleSerializer
    pagination_class = None

    def list(self, request, *args, **kwargs) -> Response:
        return Response(RoleSerializer(self.get_queryset(), many=True).data)
