from baserow.core.registries import Plugin


class ColorFieldPlugin(Plugin):
    type = "color_field"

    def get_api_urls(self):
        return []
