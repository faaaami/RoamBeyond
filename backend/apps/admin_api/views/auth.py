"""
Admin sign-in (JWT).

    POST /api/admin/auth/login/      {username, password} -> {access, refresh, user}
    POST /api/admin/auth/refresh/    {refresh}            -> {access, refresh}  (rotates)
    POST /api/admin/auth/logout/     {refresh}            -> 204 (blacklists)
    GET  /api/admin/auth/me/                              -> user + permitted sections
    POST /api/admin/auth/password/   {currentPassword, newPassword} -> 204
"""

import contextlib
from typing import Any

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.core.throttling import WindowRateThrottle

from .. import auth
from ..base import StaffAPIMixin
from ..sections import SECTIONS
from ..serializers.auth import (
    LoginResponseSerializer,
    LoginSerializer,
    LogoutSerializer,
    PasswordChangeSerializer,
    StaffRefreshSerializer,
    StaffUserSerializer,
)


class LoginThrottle(WindowRateThrottle):
    scope = "login"


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [LoginThrottle]
    serializer_class = LoginSerializer

    @extend_schema(request=LoginSerializer, responses=LoginResponseSerializer, auth=[])
    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, refresh = auth.sign_in(
            serializer.validated_data["username"],
            serializer.validated_data["password"],
            request._request,
        )
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": StaffUserSerializer(user).data,
            }
        )


class RefreshView(TokenRefreshView):
    serializer_class = StaffRefreshSerializer
    throttle_classes = [LoginThrottle]


class LogoutView(APIView):
    """Blacklists the refresh token. Succeeds even if it already expired."""

    authentication_classes = []
    permission_classes = [AllowAny]
    serializer_class = LogoutSerializer

    @extend_schema(request=LogoutSerializer, responses={204: None}, auth=[])
    def post(self, request: Request) -> Response:
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with contextlib.suppress(TokenError):  # already expired or blacklisted: signed out anyway
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(StaffAPIMixin, APIView):
    """The signed-in user, and which sections of the admin panel they may use."""

    @extend_schema(responses=StaffUserSerializer)
    def get(self, request: Request) -> Response:
        sections = []
        for section in SECTIONS:
            allowed = section.permissions_for(request.user)
            if allowed["view"]:
                sections.append(
                    {
                        "key": section.key,
                        "title": section.title,
                        "group": section.group,
                        "icon": section.icon,
                        "singleton": section.singleton,
                        "permissions": allowed,
                    }
                )
        return Response({**StaffUserSerializer(request.user).data, "sections": sections})


class PasswordView(StaffAPIMixin, APIView):
    serializer_class = PasswordChangeSerializer

    @extend_schema(request=PasswordChangeSerializer, responses={204: None})
    def post(self, request: Request) -> Response:
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user: Any = request.user  # an authenticated staff user (IsStaff)
        user.set_password(serializer.validated_data["newPassword"])
        user.save(update_fields=["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)
