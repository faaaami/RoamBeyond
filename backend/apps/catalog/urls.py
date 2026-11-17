from django.urls import path

from . import views

app_name = "catalog"

urlpatterns = [
    path("destinations/", views.DestinationListView.as_view(), name="destination-list"),
    path("packages/", views.PackageListView.as_view(), name="package-list"),
    path("packages/<slug:slug>/", views.PackageDetailView.as_view(), name="package-detail"),
    path("reviews/", views.ReviewListView.as_view(), name="review-list"),
    path("photo-credits/", views.PhotoCreditListView.as_view(), name="photo-credit-list"),
]
