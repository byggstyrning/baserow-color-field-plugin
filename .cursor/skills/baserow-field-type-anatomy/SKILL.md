---
name: baserow-field-type-anatomy
description: >-
  Reference for adding or modifying a Baserow field type in this plugin — the
  files involved, registration hooks, and required wiring on both backend and
  frontend. Use when adding a new field type, extending the color field, asking
  how Baserow plugins register field types, or wiring components in fieldTypes.js.
---

# Baserow field type anatomy

A complete field type in a Baserow plugin spans **backend** (Python/Django) and **frontend** (Nuxt/Vue). Both sides must be wired for the field to appear and function.

## Backend

All backend code lives under `plugins/baserow_color_field/backend/src/baserow_color_field/`.

### 1. Model — `models.py`

```python
from baserow.contrib.database.fields.models import Field

class ColorField(Field):
    pass
```

Subclass `Field`. Add Django model fields here if the field type needs extra database columns (the color field does not).

### 2. Field type — `field_types.py`

```python
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
        ...

    def prepare_value_for_db(self, instance, value):
        ...
```

Key points:
- `type` string must match the frontend `getType()` return value exactly.
- Choose the right base class. `CharFieldMatchingRegexFieldType` gives regex validation for free. For other data types, see Baserow's built-in field types.
- Override `prepare_value_for_db` for normalization (expansion, uppercasing).

### 3. Plugin class — `plugins.py`

```python
from baserow.core.registries import Plugin

class ColorFieldPlugin(Plugin):
    type = "color_field"

    def get_api_urls(self):
        return []
```

Override `get_api_urls()` to add custom REST endpoints if needed.

### 4. Registration — `apps.py`

```python
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
```

Both registrations happen in `ready()`. The imports are deferred to avoid circular imports with Baserow internals.

### 5. Package metadata — `setup.py`

Standard setuptools package. The `name` must match the Django app name in `apps.py`.

## Frontend

All frontend code lives under `plugins/baserow_color_field/web-frontend/`.

### 1. Field type class — `fieldTypes.js`

```javascript
import { FieldType } from '@baserow/modules/database/fieldTypes'

export class ColorFieldType extends FieldType {
  static getType()    { return 'color' }   // must match backend type
  static getIconClass() { return 'iconoir-color-wheel' }
  getName()           { return 'Color' }

  getGridViewFieldComponent()           { return GridViewFieldColor }
  getFunctionalGridViewFieldComponent() { return FunctionalGridViewFieldColor }
  getRowEditFieldComponent(field)       { return RowEditFieldColor }
  getCardComponent()                    { return RowCardFieldColor }

  getEmptyValue(field) { return '' }
  canUpsert()          { return true }
  getSort(name, order) { ... }
  prepareValueForPaste(field, clipboardData) { ... }
  getContainsFilterFunction() { ... }
}
```

Each getter maps a **view context** to a **Vue component**:

| Getter | Component | Context |
|--------|-----------|---------|
| `getGridViewFieldComponent` | `GridViewFieldColor.vue` | Editable grid cell |
| `getFunctionalGridViewFieldComponent` | `FunctionalGridViewFieldColor.vue` | Read-only grid cell |
| `getRowEditFieldComponent` | `RowEditFieldColor.vue` | Row expand modal |
| `getCardComponent` | `RowCardFieldColor.vue` | Card/kanban view |

### 2. Plugin registration — `plugin.js`

```javascript
import { ColorFieldType } from './fieldTypes'

export default defineNuxtPlugin({
  name: 'baserow-color-field',
  dependsOn: ['database'],
  setup(nuxtApp) {
    nuxtApp.$registry.register('field', new ColorFieldType({ app: nuxtApp }))
  },
})
```

`dependsOn: ['database']` ensures the database module's registry exists before this plugin registers its field type.

### 3. Module loader — `module.js`

```javascript
import { defineNuxtModule, addPlugin, createResolver } from 'nuxt/kit'

export default defineNuxtModule({
  meta: { name: 'baserow-color-field' },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)
    addPlugin({ src: resolve('./plugin.js') })
  },
})
```

The Dockerfile sets `ADDITIONAL_MODULES` to this file's path so Baserow includes it in the Nuxt build.

## Plugin metadata — `baserow_plugin_info.json`

```json
{
  "name": "Baserow Color Field",
  "version": "1.0.0",
  "supported_baserow_versions": "2.1.0>=",
  "plugin_api_version": "0.0.1-alpha"
}
```

Update `version` and `supported_baserow_versions` when bumping.

## Checklist: adding a new field type end-to-end

### Backend

- [ ] Create model class in `models.py` (subclass `Field`)
- [ ] Create field type class in `field_types.py` (set `type`, `model_class`, implement `regex`/`max_length` or equivalent)
- [ ] Register both plugin and field type in `apps.py` `ready()`
- [ ] Run migrations if the model adds columns: `docker exec baserow python3 /baserow/backend/manage.py makemigrations baserow_color_field`

### Frontend

- [ ] Create Vue components for each view context (grid, functional-grid, row-edit, card)
- [ ] Create field type class in `fieldTypes.js` (extend `FieldType`, implement getters)
- [ ] Import and wire components in the field type class
- [ ] Register in `plugin.js` via `$registry.register('field', ...)`

### Build and verify

- [ ] If frontend changed: `bash ./scripts/deploy-fast.sh`
- [ ] If backend only: `bash ./scripts/sync-backend.sh`
- [ ] `bash ./scripts/smoke-test.sh`
- [ ] Create a new field of the new type in the Baserow UI
- [ ] Test: create, edit, sort, filter, copy/paste, card view
