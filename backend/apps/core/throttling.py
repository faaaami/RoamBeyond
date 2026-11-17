import logging

from rest_framework.throttling import AnonRateThrottle

logger = logging.getLogger("rate_limit_diagnostic")

_UNITS = {"s": 1, "m": 60, "h": 3600, "d": 86400}


class WindowRateThrottle(AnonRateThrottle):
    """
    Per-client-IP throttle whose rate accepts a multiplier on the period.

    DRF only understands "5/m"; this also understands "5/10m" (five per ten
    minutes). Subclass and set `scope`; the rate comes from
    REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"][scope].
    """

    def get_ident(self, request):
        ident = super().get_ident(request)
        # TEMPORARY diagnostic: which address each request is counted under.
        logger.warning(
            "RATE_DIAG scope=%s xff=%r remote=%r ident=%r",
            getattr(self, "scope", "?"),
            request.META.get("HTTP_X_FORWARDED_FOR"),
            request.META.get("REMOTE_ADDR"),
            ident,
        )
        return ident

    def parse_rate(self, rate: str | None) -> tuple[int | None, int | None]:
        if rate is None:
            return None, None
        count, period = rate.split("/")
        unit = period[-1]
        multiplier = int(period[:-1] or 1)
        return int(count), multiplier * _UNITS[unit]
