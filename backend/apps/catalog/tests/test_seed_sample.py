"""The CI seed command fills an empty catalog once, and never touches existing content."""

from django.core.management import call_command

import pytest

from apps.catalog.models import Destination, TourPackage

pytestmark = pytest.mark.django_db


def test_seeds_an_empty_catalog_once():
    call_command("seed_sample_catalog")
    assert Destination.objects.count() == 1
    assert TourPackage.objects.get().destination == Destination.objects.get()
    call_command("seed_sample_catalog")
    assert Destination.objects.count() == 1 and TourPackage.objects.count() == 1


def test_leaves_existing_content_alone(django_user_model):
    from apps.catalog.tests.factories import make_destination

    make_destination(slug="real-place")
    call_command("seed_sample_catalog")
    assert list(Destination.objects.values_list("slug", flat=True)) == ["real-place"]
