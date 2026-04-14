import random

from baserow.contrib.database.fields.field_types import (
    CharFieldMatchingRegexFieldType,
    CollationSortMixin,
)

from .models import ColorField


class ColorFieldType(CollationSortMixin, CharFieldMatchingRegexFieldType):
    type = "color"
    model_class = ColorField
    _can_group_by = True
    can_upsert = True

    @property
    def regex(self):
        return r"^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$"

    @property
    def max_length(self):
        return 9

    def random_value(self, instance, fake, cache):
        return "#{:06x}".format(random.randint(0, 0xFFFFFF)).upper()

    def prepare_value_for_db(self, instance, value):
        if value == "" or value is None:
            return ""

        value = str(value).strip()

        if value.startswith("#"):
            if len(value) == 4:
                value = "#" + value[1] * 2 + value[2] * 2 + value[3] * 2
            elif len(value) == 5:
                value = (
                    "#" + value[1] * 2 + value[2] * 2 + value[3] * 2 + value[4] * 2
                )

        value = value.upper()

        self.validator(value)
        return value
