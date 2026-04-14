<template>
  <div
    class="grid-view__cell grid-field-color grid-field-color--functional"
  >
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
</template>

<script>
export default {
  name: 'FunctionalGridViewFieldColor',
  props: {
    value: {
      type: String,
      default: '',
    },
  },
}
</script>

<style>
.grid-field-color--functional {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 6px 0 0;
  min-height: 100%;
}

.grid-field-color--functional .grid-field-color__chip {
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

.grid-field-color--functional .grid-field-color__chip--empty {
  border-style: dashed;
  color: var(--color-neutral-600, #667085);
}

.grid-field-color--functional .grid-field-color__swatch {
  display: block;
  width: 16px;
  height: 16px;
  min-width: 16px;
  min-height: 16px;
  border-radius: 999px;
  border: 1px solid var(--color-neutral-200, rgba(0, 0, 0, 0.12));
  box-sizing: border-box;
}

.grid-field-color--functional .grid-field-color__swatch--chip {
  width: 12px;
  height: 12px;
  min-width: 12px;
  min-height: 12px;
}

.grid-field-color--functional .grid-field-color__label {
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
</style>
