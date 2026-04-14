from django.apps import AppConfig


class BaserowColorFieldConfig(AppConfig):
    name = "baserow_color_field"

    def ready(self):
        from baserow.contrib.database.fields.registries import field_type_registry
        from baserow.core.registries import plugin_registry

        from .field_types import ColorFieldType
        from .plugins import ColorFieldPlugin

        plugin_registry.register(ColorFieldPlugin())
        field_type_registry.register(ColorFieldType())
