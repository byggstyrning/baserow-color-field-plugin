import { ColorFieldType } from './fieldTypes'

export default defineNuxtPlugin({
  name: 'baserow-color-field',
  dependsOn: ['database'],
  setup(nuxtApp) {
    const { $registry } = nuxtApp
    const context = { app: nuxtApp }

    $registry.register('field', new ColorFieldType(context))
  },
})
