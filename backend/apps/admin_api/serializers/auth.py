from typing import Any

from django.contrib.auth import get_user_model, password_validation
from rest_framework import serializers

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.exceptions import SESSION_EXPIRED_MESSAGE, ApiError

User = get_user_model()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(
        max_length=254,
        trim_whitespace=True,
        error_messages={
            "blank": "Enter your username or email.",
            "required": "Enter your username or email.",
        },
    )
    password = serializers.CharField(
        max_length=128,
        trim_whitespace=False,
        style={"input_type": "password"},
        error_messages={"blank": "Enter your password.", "required": "Enter your password."},
    )


class StaffUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    isSuperuser = serializers.BooleanField(source="is_superuser")
    lastLogin = serializers.DateTimeField(source="last_login")

    class Meta:
        model = User
        fields = ("id", "username", "email", "name", "isSuperuser", "lastLogin")

    def get_name(self, user) -> str:
        return user.get_full_name() or user.get_username()


class LoginResponseSerializer(serializers.Serializer):
    """Documentation only."""

    access = serializers.CharField()
    refresh = serializers.CharField()
    user = StaffUserSerializer()


def _expired() -> ApiError:
    return ApiError(SESSION_EXPIRED_MESSAGE, code="token_not_valid", status_code=401)


class StaffRefreshSerializer(TokenRefreshSerializer):
    """SimpleJWT's refresh, plus: the user must still be active staff."""

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        try:
            token = RefreshToken(attrs["refresh"])
        except TokenError as exc:
            raise _expired() from exc
        user = User._default_manager.filter(pk=token.get("user_id")).first()
        if user is None or not user.is_active or not user.is_staff:
            raise _expired()
        try:
            return super().validate(attrs)
        except TokenError as exc:  # already rotated and blacklisted
            raise _expired() from exc


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class PasswordChangeSerializer(serializers.Serializer):
    """The signed-in user changes their own password."""

    currentPassword = serializers.CharField(trim_whitespace=False)
    newPassword = serializers.CharField(trim_whitespace=False, min_length=1)

    def validate_currentPassword(self, value: str) -> str:
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Your current password is not correct.")
        return value

    def validate_newPassword(self, value: str) -> str:
        password_validation.validate_password(value, self.context["request"].user)
        return value
