<template>
  <div class="control">
    <div class="row-edit-field-color">
      <div class="row-edit-field-color__header">
        <div
          class="row-edit-field-color__chip"
          :class="{ 'row-edit-field-color__chip--empty': !localValue }"
        >
          <span
            class="row-edit-field-color__swatch"
            :style="{ backgroundColor: localValue || 'transparent' }"
          ></span>
          <span class="row-edit-field-color__chip-label">
            {{ localValue || 'Set color' }}
          </span>
        </div>
      </div>
      <input
        ref="input"
        v-model="localValue"
        type="text"
        class="row-edit-field-color__ghost-input"
        tabindex="-1"
        aria-hidden="true"
      />

      <div
        v-if="!readOnly"
        class="row-edit-field-color__picker"
        @mousedown.capture="onPickerMouseDown"
        @touchstart.capture.passive="onPickerTouchStart"
        @pointerdown.capture="onPickerPointerDown"
        @input.stop="onPickerNativeInputStop"
        @change.stop="onPickerNativeChangeStop"
      >
        <ColorPickerPopup
          :color="localValue || '#FFFFFFFF'"
          layout="row-modal"
          @update:color="onPickerChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import rowEditField from '@baserow/modules/database/mixins/rowEditField'
import ColorPickerPopup from './ColorPickerPopup.vue'

export default {
  components: { ColorPickerPopup },
  mixins: [rowEditField],
  data() {
    return {
      localValue: this.value || '',
      pickerPointerActive: false,
      docPointerUpHandler: null,
    }
  },
  beforeUnmount() {
    this.detachDocPointerUp()
  },
  watch: {
    value(newVal) {
      this.localValue = newVal || ''
    },
  },
  methods: {
    onPickerChange(hex) {
      this.localValue = hex
      // Never emit during active drag/slider interaction; flush on pointerup.
      if (!this.pickerPointerActive) {
        this.emitIfChanged(hex)
      }
    },
    emitIfChanged(hex) {
      if (hex !== this.value) {
        this.$emit('update', hex, this.value)
      }
    },
    onPickerPointerDown() {
      this.pickerPointerActive = true
      this.attachDocPointerUp()
    },
    onPickerMouseDown() {
      this.pickerPointerActive = true
      this.attachDocPointerUp()
    },
    onPickerTouchStart() {
      this.pickerPointerActive = true
      this.attachDocPointerUp()
    },
    onPickerNativeInputStop() {
      // Native range input events in the picker should not bubble to row-level autosave.
    },
    onPickerNativeChangeStop() {
      // Native range change events in the picker should not bubble to row-level autosave.
    },
    attachDocPointerUp() {
      if (this.docPointerUpHandler) {
        return
      }
      this.docPointerUpHandler = () => {
        this.emitIfChanged(this.localValue)
        this.pickerPointerActive = false
        this.detachDocPointerUp()
      }
      document.addEventListener('pointerup', this.docPointerUpHandler, true)
      document.addEventListener('pointercancel', this.docPointerUpHandler, true)
      document.addEventListener('mouseup', this.docPointerUpHandler, true)
      document.addEventListener('touchend', this.docPointerUpHandler, true)
      document.addEventListener('touchcancel', this.docPointerUpHandler, true)
    },
    detachDocPointerUp() {
      if (!this.docPointerUpHandler) {
        return
      }
      document.removeEventListener('pointerup', this.docPointerUpHandler, true)
      document.removeEventListener(
        'pointercancel',
        this.docPointerUpHandler,
        true
      )
      document.removeEventListener('mouseup', this.docPointerUpHandler, true)
      document.removeEventListener('touchend', this.docPointerUpHandler, true)
      document.removeEventListener('touchcancel', this.docPointerUpHandler, true)
      this.docPointerUpHandler = null
    },
  },
}
</script>

<style>
.row-edit-field-color {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.row-edit-field-color__header {
  display: flex;
  align-items: center;
  min-height: 30px;
}

.row-edit-field-color__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 180px;
  min-height: 30px;
  padding: 0 10px;
  border: 1px solid var(--color-neutral-200, #d0d5dd);
  border-radius: 999px;
  background: var(--color-neutral-50, #f9fafb);
}

.row-edit-field-color__chip--empty {
  border-style: dashed;
  color: var(--color-neutral-600, #667085);
}

.row-edit-field-color__swatch {
  display: block;
  width: 12px;
  height: 12px;
  min-width: 12px;
  min-height: 12px;
  border-radius: 999px;
  border: 1px solid var(--color-neutral-200, rgba(0, 0, 0, 0.12));
  box-sizing: border-box;
}

.row-edit-field-color__chip-label {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.row-edit-field-color__picker {
  width: 100%;
  max-width: none;
  padding-top: 2px;
}

.row-edit-field-color__ghost-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  border: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

/* Row modal only: split picker into 2 columns */
.row-edit-field-color__picker .color-picker-popup {
  width: 100%;
}

.row-edit-field-color__picker .vacp-color-picker {
  display: grid !important;
  grid-template-columns: minmax(250px, 1fr) minmax(190px, 0.9fr) !important;
  grid-template-areas:
    'space hue'
    'space alpha'
    'space actions'
    'space inputs';
  column-gap: 12px;
  row-gap: 8px;
  align-items: start;
}

.row-edit-field-color__picker .vacp-color-space {
  grid-area: space;
  width: 100%;
  grid-column: 1 !important;
}

.row-edit-field-color__picker .vacp-range-input-group {
  grid-column: 2;
}

.row-edit-field-color__picker .vacp-range-input-group:first-of-type {
  grid-area: hue;
}

.row-edit-field-color__picker .vacp-range-input-group:last-of-type {
  grid-area: alpha;
}

.row-edit-field-color__picker .vacp-actions {
  grid-area: actions;
  justify-self: start;
}

.row-edit-field-color__picker .vacp-color-inputs {
  grid-area: inputs;
  grid-column: 2;
}

/* Row modal only: Baserow-like bottom controls */
.row-edit-field-color__picker .vacp-color-input-group,
.row-edit-field-color__picker .vacp-color-inputs,
.row-edit-field-color__picker .vacp-color-input,
.row-edit-field-color__picker .vacp-color-input input,
.row-edit-field-color__picker .vacp-format-switch-button,
.row-edit-field-color__picker .vacp-copy-button {
  border-radius: 5px !important;
}
</style>
