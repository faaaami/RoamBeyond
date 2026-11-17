from django.urls import path

from . import views
from .models import LegalPage

app_name = "pages"

urlpatterns = [
    path("site-settings/", views.SiteSettingsView.as_view(), name="site-settings"),
    path("navigation/", views.NavigationView.as_view(), name="navigation"),
    path("trip-types/", views.TripTypesView.as_view(), name="trip-types"),
    path("vocabulary/", views.VocabularyView.as_view(), name="vocabulary"),
    path("seo/", views.PageSeoView.as_view(), name="seo"),
    path("pages/home/", views.HomePageView.as_view(), name="page-home"),
    path("pages/about/", views.AboutPageView.as_view(), name="page-about"),
    path("pages/other/", views.OtherPagesView.as_view(), name="page-other"),
    path(
        "pages/privacy/",
        views.LegalPageView.as_view(kind=LegalPage.Kind.PRIVACY),
        name="page-privacy",
    ),
    path(
        "pages/terms/",
        views.LegalPageView.as_view(kind=LegalPage.Kind.TERMS),
        name="page-terms",
    ),
]
