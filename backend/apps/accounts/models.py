from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Staff account for the agency team.

    Defined up front, before the first migration, because swapping the user
    model later is painful. Email is unique so it can become the login later.
    """

    email = models.EmailField("email address", unique=True)

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
