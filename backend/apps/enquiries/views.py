import logging

from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from drf_spectacular.utils import PolymorphicProxySerializer, extend_schema

from apps.core.throttling import WindowRateThrottle

from . import services
from .serializers import SERIALIZERS_BY_KIND, EnquiryCreatedSerializer

logger = logging.getLogger(__name__)


class EnquiryThrottle(WindowRateThrottle):
    scope = "enquiry"


class EnquiryCreateView(APIView):
    """
    POST /api/v1/enquiries/

    Accepts a call-back request, a package enquiry or a custom trip request,
    chosen by the `kind` field. Public, rate limited per client IP.
    """

    permission_classes = [AllowAny]
    throttle_classes = [EnquiryThrottle]

    @extend_schema(
        request=PolymorphicProxySerializer(
            component_name="Enquiry",
            serializers=list(SERIALIZERS_BY_KIND.values()),
            resource_type_field_name="kind",
        ),
        responses={201: EnquiryCreatedSerializer},
        auth=[],
    )
    def post(self, request: Request) -> Response:
        payload = request.data if isinstance(request.data, dict) else {}

        # Honeypot: bots fill the hidden "website" field. Pretend it worked and store nothing.
        if str(payload.get("website", "")).strip():
            logger.info("Enquiry honeypot triggered from %s", self._client_ip(request))
            return Response({"ok": True})

        serializer_class = SERIALIZERS_BY_KIND.get(str(payload.get("kind", "")))
        if serializer_class is None:
            raise serializers.ValidationError({"kind": ["Choose a valid enquiry type"]})

        serializer = serializer_class(data=payload)
        serializer.is_valid(raise_exception=True)

        enquiry = services.create_enquiry(
            kind=serializer_class.enquiry_kind,
            data=serializer.validated_data,
            client_ip=self._client_ip(request),
            user_agent=request.headers.get("User-Agent", ""),
        )
        return Response(
            {"ok": True, "reference": str(enquiry.reference)}, status=status.HTTP_201_CREATED
        )

    def _client_ip(self, request: Request) -> str | None:
        # Same proxy-aware logic the throttle uses (NUM_PROXIES in settings).
        return EnquiryThrottle().get_ident(request)
