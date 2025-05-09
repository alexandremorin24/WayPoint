// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@nuxtjs/google-fonts'
  ],

  googleFonts: {
    families: {
      Roboto: [400, 500, 700],
    },
    display: 'swap',
    prefetch: true,
    preconnect: true,
  },

  css: [
    'vuetify/styles',
    '~/assets/css/main.css'
  ],

  i18n: {
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.json', name: 'English' },
      { code: 'fr', iso: 'fr-FR', file: 'fr.json', name: 'Français' }
    ],
    defaultLocale: 'en',
    strategy: 'prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    },
    langDir: 'locales'
  },

  runtimeConfig: {
    public: {
      API_BASE: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000/api'
    }
  },

  build: {
    transpile: ['vuetify']
  },

  vite: {
    server: {
      proxy: {
        '/api/backend': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    }
  }
})
