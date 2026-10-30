/**
 * Approximate user location for the Weekly Timescape (Shabbat) countdown.
 *
 * Shabbat times only need city-level precision (a few minutes of difference
 * across a region), so we never block the UI on the browser permission prompt:
 *
 *  - Permission granted → precise browser position (the real countdown).
 *  - Otherwise (refused, prompt ignored, no API) → approximate position from
 *    the device timezone. The device clock is set by the person, so it stays
 *    right behind a VPN, unlike an IP lookup.
 *  - Timezone not in our table → IP lookup, accepted only if its timezone
 *    matches the device one (a VPN exit node elsewhere is rejected), else a
 *    rough estimate from the UTC offset.
 */

export type ApproxLocation = {
  latitude: number
  longitude: number
  city?: string
  source: 'cache' | 'browser' | 'timezone' | 'ip' | 'offset'
}

const CACHE_KEY = 'tms:location'
const CACHE_MAX_AGE = 30 * 24 * 3600 * 1000 // 30 days

// Representative coordinates per IANA timezone (main city of the zone).
const TZ_COORDS: Record<string, [number, number, string]> = {
  // Europe
  'Europe/Zurich': [47.3769, 8.5417, 'Zurich'],
  'Europe/Paris': [48.8566, 2.3522, 'Paris'],
  'Europe/Brussels': [50.8503, 4.3517, 'Brussels'],
  'Europe/Luxembourg': [49.6116, 6.1319, 'Luxembourg'],
  'Europe/Monaco': [43.7384, 7.4246, 'Monaco'],
  'Europe/London': [51.5074, -0.1278, 'London'],
  'Europe/Dublin': [53.3498, -6.2603, 'Dublin'],
  'Europe/Lisbon': [38.7223, -9.1393, 'Lisbon'],
  'Europe/Madrid': [40.4168, -3.7038, 'Madrid'],
  'Europe/Rome': [41.9028, 12.4964, 'Rome'],
  'Europe/Berlin': [52.52, 13.405, 'Berlin'],
  'Europe/Amsterdam': [52.3676, 4.9041, 'Amsterdam'],
  'Europe/Vienna': [48.2082, 16.3738, 'Vienna'],
  'Europe/Prague': [50.0755, 14.4378, 'Prague'],
  'Europe/Warsaw': [52.2297, 21.0122, 'Warsaw'],
  'Europe/Budapest': [47.4979, 19.0402, 'Budapest'],
  'Europe/Copenhagen': [55.6761, 12.5683, 'Copenhagen'],
  'Europe/Stockholm': [59.3293, 18.0686, 'Stockholm'],
  'Europe/Oslo': [59.9139, 10.7522, 'Oslo'],
  'Europe/Helsinki': [60.1699, 24.9384, 'Helsinki'],
  'Europe/Athens': [37.9838, 23.7275, 'Athens'],
  'Europe/Istanbul': [41.0082, 28.9784, 'Istanbul'],
  'Europe/Kyiv': [50.4501, 30.5234, 'Kyiv'],
  'Europe/Kiev': [50.4501, 30.5234, 'Kyiv'],
  'Europe/Moscow': [55.7558, 37.6173, 'Moscow'],
  // Middle East / Africa
  'Asia/Jerusalem': [31.7683, 35.2137, 'Jerusalem'],
  'Asia/Tel_Aviv': [32.0853, 34.7818, 'Tel Aviv'],
  'Asia/Dubai': [25.2048, 55.2708, 'Dubai'],
  'Africa/Casablanca': [33.5731, -7.5898, 'Casablanca'],
  'Africa/Tunis': [36.8065, 10.1815, 'Tunis'],
  'Africa/Cairo': [30.0444, 31.2357, 'Cairo'],
  'Africa/Johannesburg': [-26.2041, 28.0473, 'Johannesburg'],
  // Americas
  'America/New_York': [40.7128, -74.006, 'New York'],
  'America/Toronto': [43.6532, -79.3832, 'Toronto'],
  'America/Montreal': [45.5019, -73.5674, 'Montreal'],
  'America/Chicago': [41.8781, -87.6298, 'Chicago'],
  'America/Denver': [39.7392, -104.9903, 'Denver'],
  'America/Phoenix': [33.4484, -112.074, 'Phoenix'],
  'America/Los_Angeles': [34.0522, -118.2437, 'Los Angeles'],
  'America/Vancouver': [49.2827, -123.1207, 'Vancouver'],
  'America/Mexico_City': [19.4326, -99.1332, 'Mexico City'],
  'America/Sao_Paulo': [-23.5505, -46.6333, 'São Paulo'],
  'America/Argentina/Buenos_Aires': [-34.6037, -58.3816, 'Buenos Aires'],
  // Asia / Pacific
  'Asia/Tokyo': [35.6762, 139.6503, 'Tokyo'],
  'Asia/Seoul': [37.5665, 126.978, 'Seoul'],
  'Asia/Shanghai': [31.2304, 121.4737, 'Shanghai'],
  'Asia/Hong_Kong': [22.3193, 114.1694, 'Hong Kong'],
  'Asia/Singapore': [1.3521, 103.8198, 'Singapore'],
  'Asia/Kolkata': [28.6139, 77.209, 'Delhi'],
  'Asia/Bangkok': [13.7563, 100.5018, 'Bangkok'],
  'Australia/Sydney': [-33.8688, 151.2093, 'Sydney'],
  'Australia/Melbourne': [-37.8136, 144.9631, 'Melbourne'],
  'Pacific/Auckland': [-36.8485, 174.7633, 'Auckland'],
}

// Rough latitude per timezone region, used with the UTC-offset estimate.
const REGION_LAT: Record<string, number> = {
  Europe: 48, America: 38, Asia: 30, Africa: 5, Australia: -30, Pacific: -15, Atlantic: 30, Indian: -10,
}

export function deviceTimezone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' } catch { return 'UTC' }
}

/** Is the device timezone covered by our city table? */
export function hasTimezoneCity(tz = deviceTimezone()): boolean {
  return tz in TZ_COORDS
}

/** Always returns a location — never fails, no network. */
export function locationFromTimezone(tz = deviceTimezone()): ApproxLocation {
  const hit = TZ_COORDS[tz]
  if (hit) return { latitude: hit[0], longitude: hit[1], city: hit[2], source: 'timezone' }
  // ~15° of longitude per hour of UTC offset; latitude from the tz region.
  const offsetMin = new Date().getTimezoneOffset() // UTC+1 → -60
  const region = tz.split('/')[0] ?? ''
  return { latitude: REGION_LAT[region] ?? 47, longitude: -offsetMin / 4, source: 'offset' }
}

export function readCachedLocation(): ApproxLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const c = JSON.parse(raw)
    if (typeof c?.latitude !== 'number' || typeof c?.longitude !== 'number') return null
    if (Date.now() - (c.ts ?? 0) > CACHE_MAX_AGE) return null
    // A cached position from another timezone (travel) is stale.
    if (c.tz && c.tz !== deviceTimezone()) return null
    return { latitude: c.latitude, longitude: c.longitude, source: 'cache' }
  } catch { return null }
}

function writeCachedLocation(loc: ApproxLocation) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      // City-level precision is enough — don't keep the exact position.
      latitude: Math.round(loc.latitude * 100) / 100,
      longitude: Math.round(loc.longitude * 100) / 100,
      tz: deviceTimezone(),
      ts: Date.now(),
    }))
  } catch { /* storage blocked — fine */ }
}

export type GeoPermission = 'granted' | 'prompt' | 'denied' | 'unknown'

/** Current geolocation permission, without triggering the prompt. */
export async function getGeoPermission(): Promise<{ state: GeoPermission; status: PermissionStatus | null }> {
  if (!('geolocation' in navigator)) return { state: 'denied', status: null }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
    return { state: status.state as GeoPermission, status }
  } catch {
    return { state: 'unknown', status: null } // Permissions API missing (old Safari)
  }
}

export function clearCachedLocation() {
  try { localStorage.removeItem(CACHE_KEY) } catch { /* storage blocked */ }
}

/**
 * Precise position from the browser. Shows the permission prompt if it hasn't
 * been answered yet; resolves whenever the person answers, even late (the
 * approximate countdown is already on screen meanwhile). null when refused or
 * unavailable. `timeout` only counts once permission is granted.
 */
export function getBrowserLocation(): Promise<ApproxLocation | null> {
  if (!('geolocation' in navigator)) return Promise.resolve(null)
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: ApproxLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude, source: 'browser' }
        writeCachedLocation(loc)
        resolve(loc)
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 3600000 },
    )
  })
}

/**
 * IP-based estimate. Only trusted when the IP's timezone matches the device
 * timezone — behind a VPN the IP points to the exit server, often in another
 * country, while the device clock still reflects where the person is.
 */
export async function getIpLocation(timeoutMs = 4000): Promise<ApproxLocation | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: ctrl.signal })
    if (!res.ok) return null
    const d = await res.json()
    if (typeof d?.latitude !== 'number' || typeof d?.longitude !== 'number') return null
    if (d.timezone && d.timezone !== deviceTimezone()) return null
    return { latitude: d.latitude, longitude: d.longitude, city: d.city, source: 'ip' }
  } catch { return null } finally { clearTimeout(t) }
}
