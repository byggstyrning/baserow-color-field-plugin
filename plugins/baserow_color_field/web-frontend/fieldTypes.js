import { FieldType } from '@baserow/modules/database/fieldTypes'

import GridViewFieldColor from './components/GridViewFieldColor.vue'
import FunctionalGridViewFieldColor from './components/FunctionalGridViewFieldColor.vue'
import RowEditFieldColor from './components/RowEditFieldColor.vue'
import RowCardFieldColor from './components/RowCardFieldColor.vue'

export class ColorFieldType extends FieldType {
  static getType() {
    return 'color'
  }

  static getIconClass() {
    return 'iconoir-color-wheel'
  }

  getName() {
    return 'Color'
  }

  getAlias() {
    return 'color'
  }

  getGridViewFieldComponent() {
    return GridViewFieldColor
  }

  getFunctionalGridViewFieldComponent() {
    return FunctionalGridViewFieldColor
  }

  getRowEditFieldComponent(field) {
    return RowEditFieldColor
  }

  getCardComponent() {
    return RowCardFieldColor
  }

  getEmptyValue(field) {
    return ''
  }

  canUpsert() {
    return true
  }

  getSort(name, order) {
    return (a, b) => {
      const strA = a[name] === null ? '' : '' + a[name]
      const strB = b[name] === null ? '' : '' + b[name]
      if (order === 'ASC') {
        return strA.localeCompare(strB)
      }
      return strB.localeCompare(strA)
    }
  }

  getDocsDataType(field) {
    return 'string'
  }

  getDocsDescription(field) {
    return 'A hex color value like #FF5733 or #FF573380 (with alpha).'
  }

  getDocsRequestExample(field) {
    return '#FF5733'
  }

  prepareValueForCopy(field, value) {
    return value || ''
  }

  prepareValueForPaste(field, clipboardData) {
    const value = (
      typeof clipboardData === 'string'
        ? clipboardData
        : clipboardData.getData('text')
    ).trim()
    if (/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) {
      return value.toUpperCase()
    }
    return ''
  }

  getContainsFilterFunction() {
    return (rowValue, filterValue) => {
      if (!rowValue) return false
      return rowValue.toLowerCase().includes(filterValue.toLowerCase())
    }
  }
}
