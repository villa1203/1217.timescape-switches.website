/**
 * During Shabbat, only the home page is reachable — every other route
 * redirects to it. The toggle (previewDark) no longer restricts navigation.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const isShabbat = useState('isShabbat', () => false)

  const dark =
    isShabbat.value ||
    'shabbat' in to.query ||
    'dark' in to.query

  if (dark && to.path !== '/') {
    return navigateTo('/')
  }
})
