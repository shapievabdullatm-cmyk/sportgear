export default defineNuxtConfig({
  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBase:        process.env.NUXT_PUBLIC_API_BASE,
      yandexMapsKey:  process.env.NUXT_PUBLIC_YANDEX_MAPS_KEY,
    }
  },

  app: {
    head: {
      title: 'Rage',
      htmlAttrs: {
        lang: 'ru',
      },
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/logo.svg' },
      ],
    },
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/icon'],

  icon: {
    customCollections: [
      {
        prefix: 'my',
        dir: 'app/assets/icons'
      }
    ]
  }
})