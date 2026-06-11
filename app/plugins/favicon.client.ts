// Animated favicon: slowly alternates between the two TMS favicons.
//
// Browsers don't reliably repaint the tab icon when you only change an existing
// <link>'s href, so each frame we append a fresh <link rel="icon"> and drop the
// previous one (and any static icon links from nuxt.config). The apple-touch-icon
// is left untouched.
export default defineNuxtPlugin(() => {
  const frames = ['/Favicontms.png', '/Favicontms2.png']
  const INTERVAL_MS = 1500 // slow blink — each frame is shown for exactly this long

  // Preload + decode both PNGs up front. Without this, the first time a frame is
  // shown the browser has to fetch/decode it, so the tab icon updates late and
  // that frame appears to linger — the blink looks uneven. Decoding ahead makes
  // every swap instant, so both favicons get an identical on-screen time.
  frames.forEach((src) => {
    const img = new Image()
    img.src = src
  })

  let i = 0
  let current: HTMLLinkElement | null = null

  const setFavicon = (href: string) => {
    // Drop other tab-icon links (icon / shortcut icon) so ours is the only one.
    document.querySelectorAll('link[rel~="icon"]').forEach((el) => {
      if (el !== current) el.remove()
    })

    const link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/png'
    link.href = href
    document.head.appendChild(link)

    current?.remove()
    current = link
  }

  setFavicon(frames[0])
  const timer = window.setInterval(() => {
    i = (i + 1) % frames.length
    setFavicon(frames[i]!)
  }, INTERVAL_MS)

  if (import.meta.hot) {
    import.meta.hot.dispose(() => window.clearInterval(timer))
  }
})
