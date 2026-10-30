import { useShabbatCountdown } from '~/composables/useShabbatCountdown'
import {
  type ApproxLocation,
  clearCachedLocation,
  deviceTimezone,
  getBrowserLocation,
  getGeoPermission,
  getIpLocation,
  locationFromTimezone,
  readCachedLocation,
} from '~/utils/approxLocation'
import {
  type ShabbatWindow,
  computeShabbatWindows,
  describeShabbat,
  fetchHebcalWindows,
} from '~/utils/shabbatTimes'

/**
 * Drives the "Weekly Timescape" countdown + Shabbat state.
 *
 * Permission granted → countdown from the precise position. Refused, ignored
 * or unavailable → countdown from an approximate position (device timezone),
 * shown immediately so the label is never empty, VPN or not.
 * Hebcal failures fall back to a local sunset computation.
 * Client-only: call from onMounted.
 */
export function useWeeklyTimescape() {
  const { text, isShabbat } = useShabbatCountdown()

  let location: ApproxLocation | null = null
  let windows: ShabbatWindow[] = []
  let windowsKey = ''
  let fetchedAt = 0
  let tick: ReturnType<typeof setInterval> | null = null
  let permissionStatus: PermissionStatus | null = null

  function render() {
    const state = describeShabbat(windows)
    if (!state) return
    text.value = state.text
    isShabbat.value = state.isShabbat
  }

  async function refresh(force = false) {
    if (!location) return
    const key = `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`
    const stale = Date.now() - fetchedAt > 6 * 3600000
    // Local computation first: instant, no network.
    if (force || key !== windowsKey || !windows.length) {
      windows = computeShabbatWindows(location.latitude, location.longitude)
      render()
    }
    // Then the reference times from Hebcal when the location changed or the
    // cached result is old (it also covers next week once this one ends).
    if (force || key !== windowsKey || stale) {
      windowsKey = key
      fetchedAt = Date.now()
      const remote = await fetchHebcalWindows(location.latitude, location.longitude, deviceTimezone())
      if (remote) windows = remote
      else fetchedAt = Date.now() - 5.5 * 3600000 // retry in ~30 min
    }
    render()
  }

  function setLocation(loc: ApproxLocation) {
    // Never downgrade a precise position to an estimate that arrives later.
    if (location?.source === 'browser' && loc.source !== 'browser') return
    location = loc
    if (import.meta.dev) console.info('[timescape] location', loc.source, loc)
    return refresh()
  }

  function askPrecise() {
    void getBrowserLocation().then((loc) => { if (loc) setLocation(loc) })
  }

  async function start() {
    const { state, status } = await getGeoPermission()
    permissionStatus = status
    // Refused → forget any position kept from an earlier visit.
    if (state === 'denied') clearCachedLocation()

    // 1. Something on screen right away: last precise position (if still
    //    allowed) or the timezone estimate. Never waits for the prompt.
    const initial = (state !== 'denied' && readCachedLocation()) || locationFromTimezone()
    await setLocation(initial)

    // 2. Keep the countdown ticking (Hebcal refetch is throttled in refresh()).
    tick = setInterval(() => { render(); void refresh() }, 60000)

    // 3. Precise position: asks for permission on first visit, fetched silently
    //    when already granted. Applied whenever the answer comes.
    if (state !== 'denied') askPrecise()

    // Permission granted later (e.g. from the address bar) → switch to precise;
    // revoked → back to the estimate.
    if (status) {
      status.onchange = () => {
        if (status.state === 'granted') askPrecise()
        if (status.state === 'denied') {
          clearCachedLocation()
          location = null
          void setLocation(locationFromTimezone())
        }
      }
    }

    // 4. Better estimate than the UTC offset when the timezone isn't in our table.
    if (initial.source === 'offset') {
      const ip = await getIpLocation()
      if (ip) await setLocation(ip)
    }
  }

  function stop() {
    if (tick) clearInterval(tick)
    tick = null
    if (permissionStatus) permissionStatus.onchange = null
  }

  return { start, stop }
}
