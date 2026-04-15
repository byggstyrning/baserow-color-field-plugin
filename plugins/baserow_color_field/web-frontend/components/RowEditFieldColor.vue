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
          :saved-field-value="value || ''"
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
import { colorFieldDebug } from '../utils/colorFieldDebug'

export default {
  components: { ColorPickerPopup },
  mixins: [rowEditField],
  data() {
    return {
      localValue: this.value || '',
      pickerPointerActive: false,
      docPointerUpHandler: null,
      modalCleared: false,
    }
  },
  beforeUnmount() {
    this.detachDocPointerUp()
  },
  watch: {
    value(newVal) {
      if (this.pickerPointerActive) {
        return
      }
      this.localValue = newVal || ''
    },
    row: {
      handler(newRow) {
        if (!newRow || !newRow._) {
          this.modalCleared = true
          this.detachDocPointerUp()
        }
      },
      deep: false,
    },
  },
  methods: {
    onPickerChange(hex) {
      this.localValue = hex
      colorFieldDebug('RowEditFieldColor', 'onPickerChange', {
        hex,
        pickerPointerActive: this.pickerPointerActive,
        fieldValue: this.value,
      })
      if (!this.pickerPointerActive) {
        this.emitIfChanged(hex)
      }
    },
    emitIfChanged(hex) {
      if (this.modalCleared || !this.row || !this.row._) {
        return
      }
      if (hex !== this.value) {
        colorFieldDebug('RowEditFieldColor', 'emit:update', { hex, fieldValue: this.value })
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

</style>
