<template>
  <div class="row-card-field-color">
    <span
      v-if="value"
      class="row-card-field-color__swatch"
      :style="{ backgroundColor: value }"
    ></span>
  </div>
</template>

<script>
export default {
  name: 'RowCardFieldColor',
  props: {
    value: {
      type: String,
      default: '',
    },
  },
}
</script>

<style>
.row-card-field-color {
  display: flex;
  align-items: center;
}

.row-card-field-color__swatch {
  display: inline-block;
  width: 20px;
  height: 20px;
  min-width: 20px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
</style>
