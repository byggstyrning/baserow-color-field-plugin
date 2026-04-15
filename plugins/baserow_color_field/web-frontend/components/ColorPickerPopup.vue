<template>
  <ClientOnly>
    <!-- No @mousedown.prevent: it breaks native range drag. Touch warnings come from the library. -->
    <div class="color-picker-popup" :class="popupClass">
      <ColorPicker
        :color="internalColor"
        :alpha-channel="alphaChannel"
        :copy="false"
        default-format="hex"
        :visible-formats="['hex']"
        :id="pickerId"
        @color-change="onColorChange"
      />
    </div>
  </ClientOnly>
</template>

<script>
import { ColorPicker } from 'vue-accessible-color-picker'
import Color from 'colorjs.io'
import { colorFieldDebug } from '../utils/colorFieldDebug'

let instanceCounter = 0

/** With alpha UI, pass #RRGGBBFF instead of #RRGGBB so VACP keeps a stable alpha channel. */
function ensureHexAlphaForPicker(showAlpha, hex) {
  if (!showAlpha || hex == null || hex === '') {
    return hex
  }
  const s = String(hex).trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(s)) {
    return s.toUpperCase() + 'FF'
  }
  return s
}

export default {
  components: { ColorPicker },
  props: {
    color: {
      type: String,
      default: '#FFFFFFFF',
    },
    showAlpha: {
      type: Boolean,
      default: true,
    },
    layout: {
      type: String,
      default: 'stacked',
    },
    /** Persisted cell/row value; used to ignore stale :color echoes that reset draft to saved state. */
    savedFieldValue: {
      type: String,
      default: null,
    },
  },
  emits: ['update:color'],
  data() {
    instanceCounter += 1
    return {
      internalColor: ensureHexAlphaForPicker(
        this.showAlpha,
        this.color || '#FFFFFFFF'
      ),
      pickerId: `vacp-${instanceCounter}`,
      lastEmitted: null,
    }
  },
  computed: {
    alphaChannel() {
      return this.showAlpha ? 'show' : 'hide'
    },
    popupClass() {
      return this.layout === 'row-modal' ? 'color-picker-popup--row-modal' : ''
    },
  },
  watch: {
    color(newVal) {
      const norm = (s) =>
        s == null || s === '' ? '' : String(s).trim().toUpperCase()
      const skipped =
        Boolean(newVal) &&
        newVal === this.lastEmitted &&
        String(newVal).toUpperCase() !== String(this.internalColor).toUpperCase()
      const staleSavedEchoIgnored =
        Boolean(newVal && newVal !== this.lastEmitted) &&
        this.savedFieldValue != null &&
        String(this.savedFieldValue).length > 0 &&
        norm(newVal) === norm(this.savedFieldValue) &&
        this.lastEmitted != null &&
        norm(this.lastEmitted) !== norm(this.savedFieldValue) &&
        norm(this.internalColor) === norm(this.lastEmitted)
      colorFieldDebug('ColorPickerPopup', 'watch:color', {
        pickerId: this.pickerId,
        newVal,
        lastEmitted: this.lastEmitted,
        internalColor: this.internalColor,
        skippedSyncMismatch: skipped,
        staleSavedEchoIgnored,
      })
      if (staleSavedEchoIgnored) {
        return
      }
      const bound = ensureHexAlphaForPicker(this.showAlpha, newVal)
      if (newVal && bound && bound !== this.lastEmitted) {
        this.internalColor = bound
      } else if (newVal && bound && skipped) {
        // Parent echoed our last emission but the picker internal string drifted; resync.
        this.internalColor = bound
      }
    },
  },
  methods: {
    onColorChange(eventData) {
      const hex = this.colorChangeToHex8(eventData)
      colorFieldDebug('ColorPickerPopup', 'color-change', {
        pickerId: this.pickerId,
        emittedHex: hex,
        propColor: this.color,
        cssColor: eventData.cssColor,
      })
      this.lastEmitted = hex
      this.$emit('update:color', hex)
    },
    /**
     * Serialize from the library Color object; fall back to parsing cssColor if needed.
     */
    colorChangeToHex8(eventData) {
      try {
        return this.serializeColorToHex8(eventData.color)
      } catch {
        try {
          return this.serializeColorToHex8(new Color(eventData.cssColor))
        } catch {
          return '#FFFFFFFF'
        }
      }
    },
    serializeColorToHex8(colorObj) {
      const srgb = colorObj.to('srgb')
      let s = srgb.toString({ format: 'hex', collapse: false })
      if (typeof s !== 'string' || !s.startsWith('#')) {
        return this.serializeColorToHex8Manual(srgb)
      }
      s = s.trim().toUpperCase()
      if (s.length === 7) {
        return s
      }
      if (s.length === 9) {
        return s
      }
      return this.serializeColorToHex8Manual(srgb)
    },
    serializeColorToHex8Manual(srgb) {
      const r = Math.round(
        Math.max(0, Math.min(1, srgb.coords[0])) * 255
      )
      const g = Math.round(
        Math.max(0, Math.min(1, srgb.coords[1])) * 255
      )
      const b = Math.round(
        Math.max(0, Math.min(1, srgb.coords[2])) * 255
      )
      const a = Math.round(Math.max(0, Math.min(1, srgb.alpha ?? 1)) * 255)
      const hex6 =
        '#' +
        r.toString(16).padStart(2, '0').toUpperCase() +
        g.toString(16).padStart(2, '0').toUpperCase() +
        b.toString(16).padStart(2, '0').toUpperCase()
      if (a === 255) {
        return hex6
      }
      return hex6 + a.toString(16).padStart(2, '0').toUpperCase()
    },
  },
}
</script>

<style>
@import url('vue-accessible-color-picker/styles');

.color-picker-popup {
  /* Align with grid single-line text fields (.grid-field-text / __input) */
  --vacp-width-color-space: 240px;
  --vacp-spacing: 6px;
  --vacp-font-size: 13px;
  line-height: 20px;
  --vacp-font-family: var(
    --font-sans,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif
  );
  --vacp-color-focus: var(--color-primary-500, #5190ef);
  --vacp-color-background: var(--color-neutral-0, #ffffff);
  --vacp-color-background-input: var(--color-neutral-50, #f9fafb);
  --vacp-color-border: var(--color-neutral-200, #d0d5dd);
  --vacp-color-text: var(--color-neutral-900, #101828);
  --vacp-color-text-input: var(--color-neutral-900, #101828);
  --vacp-width-border: 1px;
  border-radius: 8px;
}

.color-picker-popup .vacp-color-picker {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-areas:
    'space'
    'hue'
    'alpha';
  border: none;
  padding: 0;
  gap: 8px;
  align-items: start;
}

.color-picker-popup .vacp-color-space {
  grid-area: space;
}

.color-picker-popup .vacp-range-input-group:first-of-type {
  grid-area: hue;
}

.color-picker-popup .vacp-range-input-group:last-of-type {
  grid-area: alpha;
}

/* Rounded controls (hue / alpha tracks) */
.color-picker-popup .vacp-range-input {
  border-radius: 6px;
}

.color-picker-popup .vacp-range-input::-webkit-slider-runnable-track {
  border-radius: 6px;
}

.color-picker-popup .vacp-range-input::-moz-range-track {
  border-radius: 6px;
}

.color-picker-popup .vacp-format-switch-button,
.color-picker-popup .vacp-copy-button {
  border-radius: 5px;
}

/* Copy is disabled via :copy="false"; keep rule if library still renders a node. */
.color-picker-popup .vacp-copy-button {
  display: none !important;
}

.color-picker-popup--row-modal {
  width: 100%;
  --vacp-width-color-space: 100%;
}

.color-picker-popup--row-modal .vacp-color-picker {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(170px, 0.9fr);
  grid-template-areas:
    'space hue'
    'space alpha';
  column-gap: 14px;
  row-gap: 8px;
  align-items: start;
}

.color-picker-popup--row-modal .vacp-color-space {
  grid-area: space;
}

.color-picker-popup--row-modal .vacp-range-input-group:first-of-type {
  grid-area: hue;
  grid-column: 2;
}

.color-picker-popup--row-modal .vacp-range-input-group:last-of-type {
  grid-area: alpha;
  grid-column: 2;
}
</style>
