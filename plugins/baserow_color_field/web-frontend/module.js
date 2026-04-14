import { defineNuxtModule, addPlugin, createResolver } from 'nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'baserow-color-field',
  },

  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url)

    addPlugin({
      src: resolve('./plugin.js'),
    })
  },
})
