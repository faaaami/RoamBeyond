from django.apps import AppConfig


class PagesConfig(AppConfig):
    name = "apps.pages"
    verbose_name = "Website pages"

    def ready(self) -> None:
        from . import signals  # noqa: F401
