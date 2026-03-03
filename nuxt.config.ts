// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    baseURL: '/',
  },

  css: ['~/assets/_main.scss'],

  imports: {
    scan: false,
  },

  runtimeConfig: {
    secret_API_AUTH_EMAIL: process.env.API_AUTH_EMAIL,
    secret_API_AUTH_PASSWORD: process.env.API_AUTH_PASSWORD,
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
    },
  },

})
