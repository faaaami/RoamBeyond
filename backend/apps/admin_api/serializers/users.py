"""Staff accounts and roles. Only superusers reach these endpoints."""

from typing import Any

from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.models import Group
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from rest_framework import serializers

from .base import CamelCaseMixin

User = get_user_model()


class RoleSerializer(CamelCaseMixin, serializers.ModelSerializer):
    """A role is a Django group; its permissions decide which sections staff see."""

    sections = serializers.SerializerMethodField()
    member_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = Group
        fields = ("id", "name", "sections", "member_count")

    def get_sections(self, group: Group) -> list[str]:
        from ..sections import SECTIONS

        codenames = {f"{p.content_type.app_label}.{p.codename}" for p in group.permissions.all()}
        return [
            s.title
            for s in SECTIONS
            if s.perm("view") in codenames or s.perm("change") in codenames
        ]


class StaffAccountSerializer(CamelCaseMixin, serializers.ModelSerializer):
    roles = serializers.PrimaryKeyRelatedField(
        source="groups", queryset=Group.objects.all(), many=True, required=False
    )
    role_names = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False, trim_whitespace=False)
    email = serializers.EmailField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "is_active",
            "is_superuser",
            "roles",
            "role_names",
            "password",
            "last_login",
            "date_joined",
        )
        read_only_fields = ("last_login", "date_joined")

    def get_role_names(self, user) -> list[str]:
        return [g.name for g in user.groups.all()]

    def validate_email(self, value: str) -> str:
        clash = User._default_manager.filter(email__iexact=value)
        if self.instance:
            clash = clash.exclude(pk=self.instance.pk)
        if clash.exists():
            raise serializers.ValidationError("Another account already uses this email.")
        return value.lower()

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        request = self.context["request"]
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Set a password for the new account."})
        if attrs.get("password"):
            probe = self.instance or User(
                username=attrs.get("username", ""), email=attrs.get("email", "")
            )
            try:
                password_validation.validate_password(attrs["password"], probe)
            except DjangoValidationError as exc:
                raise serializers.ValidationError({"password": list(exc.messages)}) from exc
        if self.instance is not None and self.instance.pk == request.user.pk:
            # Nobody can lock themselves out of the admin panel.
            if attrs.get("is_active") is False:
                raise serializers.ValidationError(
                    {"is_active": "You cannot deactivate your own account."}
                )
            if attrs.get("is_superuser") is False:
                raise serializers.ValidationError(
                    {"is_superuser": "You cannot remove your own administrator access."}
                )
        return attrs

    @transaction.atomic
    def create(self, validated: dict[str, Any]):
        groups = validated.pop("groups", [])
        password = validated.pop("password")
        user = User(**validated, is_staff=True)  # every account here is a staff account
        user.set_password(password)
        user.save()
        user.groups.set(groups)
        return user

    @transaction.atomic
    def update(self, instance, validated: dict[str, Any]):
        groups = validated.pop("groups", None)
        password = validated.pop("password", None)
        for name, value in validated.items():
            setattr(instance, name, value)
        if password:
            instance.set_password(password)
        instance.save()
        if groups is not None:
            instance.groups.set(groups)
        return instance
