/**
 * During Shabbat (or the `?shabbat` / `?dark` preview), only the home page is
 * reachable — every other route redirects to it.
 *
 * The Shabbat state is determined client-side (from the hebcal API in AppNav),
 * so this runs on the client only. The "Shabbat starts while already on a page"
 * case is handled by a watcher in app.vue.
 */
export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const isShabbat = useState('isShabbat', () => false)
  const previewDark = useState('previewDark', () => false)

  const dark =
    isShabbat.value ||
    previewDark.value ||
    'shabbat' in to.query ||
    'dark' in to.query

  if (dark && to.path !== '/') {
    return navigateTo('/')
  }
})
