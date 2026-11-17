"""Package classifications. Values match `categories` and `budgets` in src/data/types.ts."""

from django.db import models

from apps.core.enums import TripType

__all__ = ["BudgetBand", "Category", "TripType"]


class Category(models.TextChoices):
    HILLS = "hills", "Hills and valleys"
    BEACH = "beach", "Beach and islands"
    HERITAGE = "heritage", "Heritage and culture"
    ADVENTURE = "adventure", "Adventure"
    PILGRIMAGE = "pilgrimage", "Pilgrimage"
    NATURE = "nature", "Nature and backwaters"


class BudgetBand(models.TextChoices):
    VALUE = "value", "Value"
    COMFORT = "comfort", "Comfort"
    PREMIUM = "premium", "Premium"
