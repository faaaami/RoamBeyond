"""Vocabulary shared by more than one app. Values match src/data/types.ts."""

from django.db import models


class TripType(models.TextChoices):
    SOLO = "solo", "Solo"
    COUPLE = "couple", "Couple"
    FAMILY = "family", "Family"
    FRIENDS = "friends", "Friends group"
    CORPORATE = "corporate", "Corporate"


class DurationBand(models.TextChoices):
    """Trip length filters. A package matches a band when its days fall in min..max."""

    SHORT = "short", "Up to 4 days"
    MEDIUM = "medium", "5 to 7 days"
    LONG = "long", "8 days or more"


DURATION_RANGES: dict[str, tuple[int, int]] = {
    DurationBand.SHORT: (1, 4),
    DurationBand.MEDIUM: (5, 7),
    DurationBand.LONG: (8, 99),
}
