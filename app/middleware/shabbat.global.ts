/**
 * During Shabbat, only the home page is reachable — every other route
 * redirects to it. The toggle (previewDark) no longer restricts navigation.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const isShabbat = useState('isShabbat', () => false)

  // Only the real Shabbat window (or its ?shabbat preview) locks the site to the
  // home. The ?dark toggle preview is a purely aesthetic mode — it does NOT
  // restrict navigation.
  const shabbat = isShabbat.value || 'shabbat' in to.query

  if (shabbat && to.path !== '/') {
    return navigateTo('/')
  }
})
