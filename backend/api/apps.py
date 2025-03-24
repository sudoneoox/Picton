from django.apps import AppConfig
from django.urls import get_resolver, URLPattern, URLResolver
from utils import pretty_print


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        from django.conf import settings

        if settings.DEBUG:
            self.list_api_urls()

    def list_api_urls(self):
        resolver = get_resolver()

        def recursive_list(patterns, prefix=""):
            for pattern in patterns:
                if isinstance(pattern, URLPattern):
                    # Clean up URL pattern by removing regex and extra slashes

                    url = prefix + str(pattern.pattern)
                    clean_url = (
                        url.replace("^", "")
                        .replace("$", "")
                        .replace("//", "/")
                        .replace("(?P<format>[a-z0-9]+)/?", "")
                        .replace("(?P<pk>[/.]+)", ":id")
                        .strip("/")
                    )
                    # Only show if it's an API route or admin route
                    if clean_url.startswith(("api", "admin")):
                        pretty_print(clean_url, "INFO")
                elif isinstance(pattern, URLResolver):
                    new_prefix = (
                        f"{prefix}{pattern.pattern}/"
                        if prefix
                        else f"{pattern.pattern}/"
                    )
                    recursive_list(pattern.url_patterns, new_prefix)

        pretty_print(f"{'=' * 20} API Routes {'=' * 20}", "INFO")
        recursive_list(resolver.url_patterns)
        pretty_print("=" * 50, "INFO")
