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

        // Preload the fonts used above the fold so text (and the SVG stickers,
        // which measure font metrics before wrapping) doesn't wait a round-trip:
        // body + bold UI in Sligoil, content titles in Happy Times.
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/Sligoil-Micro.woff2', crossorigin: '' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/Sligoil-MicroBold.woff2', crossorigin: '' },
        { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/happy-times-NG_regular_master_web.woff2', crossorigin: '' },
      ],
    },
  },

  css: ['~/assets/_main.scss'],

  imports: {
    scan: false,
  },

  nitro: {
    // Pre-compress the generated output (gzip + brotli) so the static host can
    // serve .br/.gz directly — smaller transfers for HTML/JS/CSS/SVG/fonts.
    compressPublicAssets: { gzip: true, brotli: true },

    prerender: {
      routes: ['/'],
      ignore: [
        "/sticker-test",
        "/globe",
        "/info-advanced",
      ],
    },

  },

  runtimeConfig: {
    secret_API_AUTH_EMAIL: process.env.API_AUTH_EMAIL,
    secret_API_AUTH_PASSWORD: process.env.API_AUTH_PASSWORD,
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE,
      // Public URL of this front-end — used for canonical links, Open Graph URLs
      // and the sitemap / robots.txt. No trailing slash.
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL,
    },
  },

})
