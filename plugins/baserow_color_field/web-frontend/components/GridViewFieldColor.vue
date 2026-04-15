<template>
  <div
    ref="cell"
    class="grid-view__cell grid-field-color active"
    :class="{ editing }"
  >
    <div v-if="!editing" class="grid-field-color__display">
      <div
        class="grid-field-color__chip"
        :class="{ 'grid-field-color__chip--empty': !value }"
      >
        <span
          class="grid-field-color__swatch grid-field-color__swatch--chip"
          :style="{ backgroundColor: value || 'transparent' }"
        ></span>
        <span class="grid-field-color__label">{{ value || 'Set color' }}</span>
      </div>
    </div>
    <div v-else class="grid-field-color__editing">
      <div class="grid-field-color__chip grid-field-color__chip--editing">
        <span
          class="grid-field-color__swatch grid-field-color__swatch--chip"
          :style="{ backgroundColor: draft || 'transparent' }"
        ></span>
        <input
          ref="input"
          v-model="draft"
          type="text"
          class="grid-field-text__input grid-field-color__hex-input"
          maxlength="9"
          placeholder="#RRGGBB"
          @keydown.enter.exact.prevent="commitEdit"
        />
      </div>
      <div
        ref="pickerContainer"
        class="grid-field-color__picker-dropdown"
        @mousedown.stop="onPickerMouseDown"
        @pointerdown.stop="onPickerPointerDown"
        @pointermove.capture="onPickerPointerMove"
        @mousemove.capture="onPickerMouseMove"
      >
        <ColorPickerPopup
          :color="draft || '#FFFFFFFF'"
          :saved-field-value="value || ''"
          @update:color="onPickerChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import gridField from '@baserow/modules/database/mixins/gridField'
import ColorPickerPopup from './ColorPickerPopup.vue'
import { colorFieldDebug } from '../utils/colorFieldDebug'

export default {
  components: { ColorPickerPopup },
  mixins: [gridField],
  data() {
    return {
      editing: false,
      draft: '',
      keydownHandler: null,
      pickerPointerActive: false,
      docPointerUpHandler: null,
      /** Latest hex from picker; applied to draft after drag ends or immediately when typing in popup. */
      pendingPickerHex: null,
    }
  },
  beforeUnmount() {
    this.detachDocPointerUp()
  },
  methods: {
    select() {
      // Same pattern as gridFieldInput: listen on document.body so behavior matches
      // other grid fields (arrows/tab interact correctly with gridField's own handler).
      this.keydownHandler = (event) => {
        if (!this.canKeyDown(event)) {
          return
        }

        if (this.editing) {
          // Tab inside the popup must not bubble to the grid: otherwise the cell can
          // unmount before vacp input change handlers run (null ref in library le()).
          if (event.key === 'Tab') {
            const el = document.activeElement
            if (
              el &&
              typeof el.closest === 'function' &&
              el.closest('.color-picker-popup')
            ) {
              event.stopPropagation()
            }
            return
          }
          const ignoredKeys = [
            'ArrowLeft',
            'ArrowUp',
            'ArrowRight',
            'ArrowDown',
          ]
          if (ignoredKeys.includes(event.key)) {
            return
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            this.cancelEdit()
            return
          }
          // Match gridFieldInput: Enter saves, moves down; Shift+Enter is for add-row (gridField).
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            event.stopPropagation()
            if (this.normalizeHex(this.draft) !== null) {
              this.commitEdit()
              this.$emit('selectBelow')
            }
            return
          }
          return
        }

        if (event.key === 'Enter' || event.key === 'F2') {
          event.preventDefault()
          event.stopPropagation()
          this.startEdit()
          return
        }

        if (this.isPrintableKey(event)) {
          event.preventDefault()
          event.stopPropagation()
          this.startEdit()
        }
      }

      document.body.addEventListener('keydown', this.keydownHandler)
    },
    beforeUnSelect() {
      if (this.keydownHandler) {
        document.body.removeEventListener('keydown', this.keydownHandler)
        this.keydownHandler = null
      }
      this.flushPickerDraftFromPending()
      this.detachDocPointerUp()
      this.pickerPointerActive = false
      if (this.editing) {
        this.commitEdit()
      }
    },
    doubleClick() {
      this.startEdit()
    },
    canSelectNext(event) {
      if (this.editing && event && event.key !== 'Tab') {
        return false
      }
      return true
    },
    canKeyboardShortcut() {
      return !this.editing
    },
    /**
     * Must return false for any interaction inside the vue-accessible-color-picker:
     * - 2D area uses pointer capture / document listeners; click target on release may
     *   not be contained in the cell subtree.
     * - ClientOnly can change subtree timing; composedPath catches shadow paths.
     */
    canUnselectByClickingOutside(event) {
      if (event?.shiftKey) {
        return false
      }
      if (this.pickerPointerActive) {
        return false
      }
      // Picker may be outside the cell in the event chain (ClientOnly, re-parenting) or
      // stopPropagation can skip the cell's inside-click bookkeeping in onClickOutside.
      if (this.editing && this.eventPointOverPicker(event)) {
        return false
      }
      if (this.eventPathTouchesPicker(event)) {
        return false
      }
      return true
    },
    eventPointOverPicker(event) {
      const el = this.$refs.pickerContainer
      if (!el || typeof el.getBoundingClientRect !== 'function') {
        return false
      }
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        return false
      }
      const x = event.clientX
      const y = event.clientY
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    },
    eventPathTouchesPicker(event) {
      const path =
        typeof event.composedPath === 'function'
          ? event.composedPath()
          : [event.target]
      for (let i = 0; i < path.length; i++) {
        const node = path[i]
        if (!node || node.nodeType !== 1) {
          continue
        }
        const el = node
        if (el.classList) {
          if (el.classList.contains('color-picker-popup')) {
            return true
          }
          if (el.classList.contains('vacp-color-picker')) {
            return true
          }
          if ([...el.classList].some((c) => c.startsWith('vacp-'))) {
            return true
          }
        }
        if (
          this.$refs.pickerContainer &&
          (el === this.$refs.pickerContainer ||
            this.$refs.pickerContainer.contains(el))
        ) {
          return true
        }
      }
      return false
    },
    onPickerPointerDown() {
      this.pickerPointerActive = true
      this.attachDocPointerUp()
    },
    onPickerMouseDown() {
      this.pickerPointerActive = true
      this.attachDocPointerUp()
    },
    onPickerPointerMove(event) {
      if (event?.buttons > 0 && !this.pickerPointerActive) {
        this.pickerPointerActive = true
        this.attachDocPointerUp()
      }
    },
    onPickerMouseMove(event) {
      if (event?.buttons > 0 && !this.pickerPointerActive) {
        this.pickerPointerActive = true
        this.attachDocPointerUp()
      }
    },
    /**
     * While dragging the 2D area or sliders, defer syncing hex into `draft` so the
     * cell input / prop round-trip does not run every move. Hex is edited in the cell only.
     */
    isPickerTextInputFocused() {
      const el = document.activeElement
      if (!el || el.nodeType !== 1) {
        return false
      }
      if (!el.closest?.('.color-picker-popup')) {
        return false
      }
      if (el.tagName === 'INPUT') {
        const inputType = (el.getAttribute('type') || '').toLowerCase()
        // Range/color slider inputs fire continuously while dragging.
        // Keep those deferred until pointerup.
        return !['range', 'color'].includes(inputType)
      }
      const tag = el.tagName
      if (tag === 'TEXTAREA' || tag === 'SELECT') {
        return true
      }
      return el.isContentEditable === true
    },
    flushPickerDraftFromPending() {
      if (this.pendingPickerHex != null) {
        this.draft = this.pendingPickerHex
      }
    },
    attachDocPointerUp() {
      if (this.docPointerUpHandler) {
        return
      }
      this.docPointerUpHandler = () => {
        this.flushPickerDraftFromPending()
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
      document.removeEventListener('pointercancel', this.docPointerUpHandler, true)
      document.removeEventListener('mouseup', this.docPointerUpHandler, true)
      document.removeEventListener('touchend', this.docPointerUpHandler, true)
      document.removeEventListener('touchcancel', this.docPointerUpHandler, true)
      this.docPointerUpHandler = null
    },
    isPrintableKey(event) {
      return (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      )
    },
    startEdit() {
      this.editing = true
      this.draft = this.value || ''
      this.pendingPickerHex = this.draft || null
      this.$nextTick(() => {
        this.$refs.input?.focus()
        if (this.$refs.input) {
          this.$refs.input.selectionStart = this.$refs.input.selectionEnd =
            this.$refs.input.value.length
        }
      })
    },
    cancelEdit() {
      this.detachDocPointerUp()
      this.pickerPointerActive = false
      this.pendingPickerHex = null
      this.editing = false
      this.draft = this.value || ''
    },
    onPickerChange(hex) {
      this.pendingPickerHex = hex
      // Always keep `draft` in sync with the picker emission so `:color` and the swatch
      // stay aligned with the library internal color.
      this.draft = hex
      colorFieldDebug('GridViewFieldColor', 'onPickerChange', {
        hex,
        pickerPointerActive: this.pickerPointerActive,
        fieldValue: this.value,
      })
    },
    normalizeHex(val) {
      if (val == null) return ''
      let v = String(val).trim()
      if (!v) return ''
      v = v.toUpperCase()
      if (v && !v.startsWith('#')) {
        v = '#' + v
      }
      if (v.length === 4) {
        v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3]
      }
      if (v.length === 5) {
        v =
          '#' +
          v[1] + v[1] +
          v[2] + v[2] +
          v[3] + v[3] +
          v[4] + v[4]
      }
      if (!/^#([0-9A-F]{6}|[0-9A-F]{8})$/.test(v)) {
        return null
      }
      if (v.length === 9 && v.endsWith('FF')) {
        v = v.slice(0, 7)
      }
      return v
    },
    commitEdit() {
      if (!this.editing) {
        return
      }
      this.flushPickerDraftFromPending()
      this.detachDocPointerUp()
      this.pickerPointerActive = false
      const normalized = this.normalizeHex(this.draft)
      if (normalized === null) {
        this.draft = this.value || ''
        this.editing = false
        return
      }
      if (normalized !== (this.value || '')) {
        this.$emit('update', normalized, this.value)
      }
      this.editing = false
    },
  },
}
</script>

<style>
.grid-field-color {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  padding: 5px 6px 0 5px;
  position: relative;
  min-height: 100%;
}

.grid-field-color__display {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  min-height: 24px;
}

.grid-field-color__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 22px;
  max-width: 100%;
  padding: 0 8px;
  border: 1px solid var(--color-neutral-200, #d0d5dd);
  border-radius: 999px;
  background: var(--color-neutral-50, #f9fafb);
}

.grid-field-color__chip--editing {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.grid-field-color__chip--empty {
  border-style: dashed;
  color: var(--color-neutral-600, #667085);
}

.grid-field-color__swatch {
  display: block;
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  border-radius: 999px;
  border: 1px solid var(--color-neutral-200, rgba(0, 0, 0, 0.12));
  box-sizing: border-box;
}

.grid-field-color__swatch--chip {
  width: 12px;
  height: 12px;
  min-width: 12px;
  min-height: 12px;
}

.grid-field-color__label {
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

.grid-field-color__editing {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  min-height: 24px;
  position: relative;
}

/* Match read-only chip row; reset Baserow text-field padding/height that shifts content down */
.grid-field-color .grid-field-color__chip--editing .grid-field-text__input.grid-field-color__hex-input {
  flex: 1;
  min-width: 72px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  color: inherit;
  min-height: 16px;
  height: auto;
}

.grid-field-color .grid-field-color__chip--editing .grid-field-text__input.grid-field-color__hex-input:focus {
  outline: none;
}

.grid-field-color__picker-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 50;
  margin-top: 4px;
  background: var(--color-neutral-0, #fff);
  border: 1px solid var(--color-neutral-200, #d0d5dd);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(16, 24, 40, 0.12);
  padding: 8px;
  width: 272px;
  touch-action: none;
}
</style>
