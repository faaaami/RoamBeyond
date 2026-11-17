"""
The admin API, mounted at /api/admin/ (config/urls.py).

Every endpoint except login, refresh and logout needs a staff JWT.
"""

from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import auth, catalog, enquiries, health, pages, stats, users

app_name = "admin_api"

router = SimpleRouter()
router.register("enquiries", enquiries.EnquiryViewSet, basename="enquiry")
router.register("packages", catalog.TourPackageViewSet, basename="package")
router.register("destinations", catalog.DestinationViewSet, basename="destination")
router.register("reviews", catalog.ReviewViewSet, basename="review")
router.register("photo-credits", catalog.PhotoCreditViewSet, basename="photo-credit")
router.register("legal-pages", pages.LegalPageViewSet, basename="legal-page")
router.register("nav-links", pages.NavLinkViewSet, basename="nav-link")
router.register("trip-types", pages.TripTypeInfoViewSet, basename="trip-type")
router.register("page-seo", pages.PageSeoViewSet, basename="page-seo")
router.register("users", users.StaffAccountViewSet, basename="user")
router.register("roles", users.RoleViewSet, basename="role")

urlpatterns = [
    path("auth/login/", auth.LoginView.as_view(), name="login"),
    path("auth/refresh/", auth.RefreshView.as_view(), name="refresh"),
    path("auth/logout/", auth.LogoutView.as_view(), name="logout"),
    path("auth/me/", auth.MeView.as_view(), name="me"),
    path("auth/password/", auth.PasswordView.as_view(), name="password"),
    path("stats/", stats.StatsView.as_view(), name="stats"),
    path("activity/", stats.ActivityView.as_view(), name="activity"),
    path("options/", stats.OptionsView.as_view(), name="options"),
    path("health/", health.HealthView.as_view(), name="health"),
    path("pages/site-settings/", pages.SiteSettingsView.as_view(), name="site-settings"),
    path("pages/home/", pages.HomePageView.as_view(), name="home-page"),
    path("pages/about/", pages.AboutPageView.as_view(), name="about-page"),
    path("pages/other/", pages.OtherPagesView.as_view(), name="other-pages"),
    *router.urls,
]
