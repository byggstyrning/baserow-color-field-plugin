<template>
  <ClientOnly>
    <!-- No @mousedown.prevent: it breaks native range drag. Touch warnings come from the library. -->
    <div class="color-picker-popup" :class="popupClass">
      <ColorPicker
        :color="internalColor"
        :alpha-channel="alphaChannel"
        :copy="false"
        default-format="hex"
        :visible-formats="['hex', 'hsl', 'srgb']"
        :id="pickerId"
        @color-change="onColorChange"
      />
    </div>
  </ClientOnly>
</template>

<script>
import { ColorPicker } from 'vue-accessible-color-picker'

let instanceCounter = 0

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
  },
  emits: ['update:color'],
  data() {
    instanceCounter += 1
    return {
      internalColor: this.color || '#FFFFFFFF',
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
      if (newVal && newVal !== this.lastEmitted) {
        this.internalColor = newVal
      }
    },
  },
  methods: {
    onColorChange(eventData) {
      const hex = this.colorToHex8(eventData.color)
      this.lastEmitted = hex
      this.$emit('update:color', hex)
    },
    colorToHex8(color) {
      try {
        const srgb = color.to('srgb')
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
      } catch {
        return '#FFFFFFFF'
      }
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
  grid-template-columns: 1fr min-content;
  grid-template-areas:
    'space space'
    'hue hue'
    'alpha alpha'
    'inputs actions';
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

.color-picker-popup .vacp-color-inputs {
  grid-area: inputs;
  grid-column: 1;
}

.color-picker-popup .vacp-actions {
  grid-area: actions;
  grid-column: 2;
  align-self: stretch !important;
  justify-self: end;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding-top: calc(var(--vacp-spacing, 6px) * 2);
}

.color-picker-popup .vacp-actions > * {
  align-self: flex-end;
}

.color-picker-popup .vacp-color-input-group {
  border-radius: 5px;
}

/* Rounded controls (hue / alpha tracks + bottom hex / format inputs) */
.color-picker-popup .vacp-range-input {
  border-radius: 6px;
}

.color-picker-popup .vacp-range-input::-webkit-slider-runnable-track {
  border-radius: 6px;
}

.color-picker-popup .vacp-range-input::-moz-range-track {
  border-radius: 6px;
}

.color-picker-popup .vacp-color-input {
  border-radius: 5px;
  font-family: var(--vacp-font-family);
  font-size: var(--vacp-font-size);
  line-height: 20px;
  font-weight: 400;
  letter-spacing: normal;
  font-variant-numeric: tabular-nums;
}

.color-picker-popup .vacp-color-input input {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.color-picker-popup .vacp-format-switch-button,
.color-picker-popup .vacp-copy-button {
  border-radius: 5px;
}

/* Copy action is disabled in both grid and row modal pickers. */
.color-picker-popup .vacp-copy-button {
  display: none !important;
}

.color-picker-popup--row-modal {
  width: 100%;
  --vacp-width-color-space: 100%;
}

.color-picker-popup--row-modal .vacp-color-picker {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(170px, 0.9fr) min-content;
  grid-template-areas:
    'space hue hue'
    'space alpha alpha'
    'space inputs actions';
  column-gap: 14px;
  row-gap: 8px;
  align-items: start;
}

.color-picker-popup--row-modal .vacp-color-space {
  grid-area: space;
}

.color-picker-popup--row-modal .vacp-range-input-group:first-of-type {
  grid-area: hue;
  grid-column: 2 / 4;
}

.color-picker-popup--row-modal .vacp-range-input-group:last-of-type {
  grid-area: alpha;
  grid-column: 2 / 4;
}

.color-picker-popup--row-modal .vacp-color-inputs {
  grid-area: inputs;
  grid-column: 2;
}

.color-picker-popup--row-modal .vacp-actions {
  grid-area: actions;
  grid-column: 3;
  justify-self: end;
  align-self: stretch !important;
}
</style>
