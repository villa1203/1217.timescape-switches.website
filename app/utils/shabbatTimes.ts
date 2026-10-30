/**
 * Weekly Shabbat windows (candle-lighting → havdalah).
 *
 * Primary source: Hebcal API. Fallback: a local astronomical computation
 * (sunrise equation, ±1–2 min) so the countdown still shows when Hebcal is
 * unreachable (offline, blocked by an extension, API change…).
 * Same conventions as the Hebcal request: candles 18 min before sunset (b=18),
 * havdalah at nightfall, sun 8.5° below the horizon (M=on).
 */

export type ShabbatWindow = { candles: Date; havdalah: Date }

const RAD = Math.PI / 180
const DAY_MS = 86400000
const J1970 = 2440587.5
const J2000 = 2451545

/**
 * UTC instant when the sun goes down through `altitude` (degrees) on the
 * given local calendar day, at lat/lon (east positive). null at polar latitudes.
 */
export function sunDescendingTime(year: number, month: number, day: number, lat: number, lon: number, altitude: number): Date | null {
  const n = Math.round((Date.UTC(year, month, day, 12) - Date.UTC(2000, 0, 1, 12)) / DAY_MS)
  const jStar = n + 0.0009 - lon / 360
  const M = (357.5291 + 0.98560028 * jStar) % 360
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD)
  const lambda = (M + C + 180 + 102.9372) % 360
  const jTransit = J2000 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD)
  const sinDec = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD)
  const cosDec = Math.cos(Math.asin(sinDec))
  const cosH = (Math.sin(altitude * RAD) - Math.sin(lat * RAD) * sinDec) / (Math.cos(lat * RAD) * cosDec)
  if (cosH < -1 || cosH > 1) return null
  const jSet = jTransit + Math.acos(cosH) / RAD / 360
  return new Date((jSet - J1970) * DAY_MS)
}

/** Shabbat windows computed locally around `now` (last week → in 2 weeks). */
export function computeShabbatWindows(lat: number, lon: number, now = new Date()): ShabbatWindow[] {
  const out: ShabbatWindow[] = []
  // Friday of the current week (device local calendar)
  const friday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  friday.setDate(friday.getDate() + ((5 - friday.getDay() + 7) % 7) - 7)
  for (let w = 0; w < 3; w++) {
    const fri = new Date(friday.getFullYear(), friday.getMonth(), friday.getDate() + 7 * w)
    const sat = new Date(fri.getFullYear(), fri.getMonth(), fri.getDate() + 1)
    const sunset = sunDescendingTime(fri.getFullYear(), fri.getMonth(), fri.getDate(), lat, lon, -0.833)
    const night = sunDescendingTime(sat.getFullYear(), sat.getMonth(), sat.getDate(), lat, lon, -8.5)
    if (!sunset || !night) continue
    out.push({ candles: new Date(sunset.getTime() - 18 * 60000), havdalah: night })
  }
  return out
}

/** Shabbat windows from the Hebcal API (weekly Shabbat only, no Yom Tov). */
export async function fetchHebcalWindows(lat: number, lon: number, tz: string, timeoutMs = 6000): Promise<ShabbatWindow[] | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const url = `https://www.hebcal.com/shabbat?cfg=json&latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}&tzid=${encodeURIComponent(tz)}&b=18&M=on&leyning=off`
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) return null
    const items: { category: string; date: string }[] = (await res.json())?.items ?? []
    const candles = items.filter(i => i.category === 'candles' && new Date(i.date).getDay() === 5).map(i => new Date(i.date))
    const havdalahs = items.filter(i => i.category === 'havdalah' && new Date(i.date).getDay() === 6).map(i => new Date(i.date))
    const windows: ShabbatWindow[] = []
    for (const c of candles) {
      const h = havdalahs.find(x => x > c && x.getTime() - c.getTime() < 2 * DAY_MS)
      if (h) windows.push({ candles: c, havdalah: h })
    }
    return windows.length ? windows : null
  } catch { return null } finally { clearTimeout(t) }
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`

/** Countdown label + Shabbat state for `now`. null if no window is known. */
export function describeShabbat(windows: ShabbatWindow[], now = new Date()): { text: string; isShabbat: boolean } | null {
  const current = windows.find(w => now >= w.candles && now < w.havdalah)
  if (current) {
    const diff = current.havdalah.getTime() - now.getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return {
      isShabbat: true,
      text: h > 0
        ? `Weekly Timescape\nends in ${plural(h, 'hour')}, ${plural(m, 'minute')}`
        : `Weekly Timescape\nends in ${plural(m, 'minute')}`,
    }
  }
  const next = windows.filter(w => w.candles > now).sort((a, b) => a.candles.getTime() - b.candles.getTime())[0]
  if (!next) return null
  const diff = next.candles.getTime() - now.getTime()
  const d = Math.floor(diff / DAY_MS)
  const h = Math.floor((diff % DAY_MS) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  let text: string
  if (d > 0) text = `Weekly Timescape\nin ${plural(d, 'day')}, ${plural(h, 'hour')}, ${plural(m, 'minute')}`
  else if (h > 0) text = `Weekly Timescape\nin ${plural(h, 'hour')}, ${plural(m, 'minute')}`
  else text = `Weekly Timescape\nin ${plural(m, 'minute')}`
  return { isShabbat: false, text }
}
