// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    baseURL: '/',
    head: {
      link: [
        // Custom TMS favicon (served from /public). The PNG variant takes
        // precedence over the legacy /favicon.ico that Nuxt would otherwise
        // pick up automatically.
        { rel: 'icon', type: 'image/png', href: '/Favicontms.png' },
        { rel: 'shortcut icon', type: 'image/png', href: '/Favicontms.png' },
        { rel: 'apple-touch-icon', href: '/Favicontms.png' },
      ],
    },
  },

  css: ['~/assets/_main.scss'],

  imports: {
    scan: false,
  },

  nitro: {
    prerender: {
      routes: ['/'],
    },
  },

  runtimeConfig: {
    secret_API_AUTH_EMAIL: process.env.API_AUTH_EMAIL,
    secret_API_AUTH_PASSWORD: process.env.API_AUTH_PASSWORD,
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
    },
  },

})
