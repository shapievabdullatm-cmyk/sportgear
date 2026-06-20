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
      meta: [
        { name: 'theme-color', content: '#C1121C' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Rage' },
        { name: 'mobile-web-app-capable', content: 'yes' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
        { rel: 'mask-icon', href: '/logo.svg', color: '#C1121C' },
      ],
    },
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@nuxt/icon', '@vite-pwa/nuxt'],

  icon: {
    customCollections: [
      {
        prefix: 'my',
        dir: 'app/assets/icons'
      }
    ]
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Rage — спортивные товары',
      short_name: 'Rage',
      description: 'Интернет-магазин спортивных товаров Rage',
      lang: 'ru',
      theme_color: '#C1121C',
      background_color: '#000000',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      scope: '/',
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [
        { name: 'Каталог', url: '/catalog/all', icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        { name: 'Корзина',  url: '/cart',        icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
        { name: 'Избранное', url: '/wishlist',   icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }] },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
      navigateFallback: '/offline',
      navigateFallbackDenylist: [/^\/admin/, /^\/api/],
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: ({ url, request }) =>
            request.method === 'GET' &&
            /\/api\/(categories|brands|product-collections|sliders|quick-links|settings|blogs|blog-categories|brand-origins|manufacturing-countries|popular-categories)/.test(url.pathname),
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'rage-api-public',
            expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: ({ url, request }) =>
            request.method === 'GET' &&
            /\/api\/(products|catalog|search)/.test(url.pathname),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'rage-api-products',
            networkTimeoutSeconds: 4,
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 6 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: ({ request }) => request.destination === 'image',
          handler: 'CacheFirst',
          options: {
            cacheName: 'rage-images',
            expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: ({ request }) => request.destination === 'font',
          handler: 'CacheFirst',
          options: {
            cacheName: 'rage-fonts',
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      navigateFallback: '/',
      type: 'module',
    },
  },
})