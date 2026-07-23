<template>
    <nav class="v-nav app-with-padding--left-right app-with-padding--top-bottom"
    >
      <div class="app-grid app-grid--justify-between">
        <div :class="['nav-left', { 'nav-left--locked': isShabbat }]">
          <StickerButton :text="shabbatText" to="/" :font_size="navFontSize" :max_width="isMobile ? 330 : 600" :flip="isShabbat" :blob_scale="1.25" @click="closeResearch" />
        </div>

        <div :class="['nav-right', { 'nav-right--hidden': isOpen, 'nav-right--scroll-hidden': hiddenOnScroll, 'nav-right--locked': isShabbat }]">
          <div class="app-grid nav-right__grid">
            <div style="overflow: hidden !important;">
                <div style="width: 100%; aspect-ratio: 12/1" />
              <StickerButton
                text="Research"
                @click="openResearch"
                :font_size="navFontSize"
                color="var(--app-color-primary)"
                :active="researchActive"
                :flip="isShabbat"
                :blob_scale="1.25"
              />
            </div>

              <div style="overflow: hidden !important;" >
                  <div style="width: 100%; aspect-ratio: 7.25/1" />
              <StickerButton text="Info" @click="openInfo" :font_size="navFontSize" :active="isInfoPage" :flip="isShabbat" :blob_scale="1.25" />
            </div>
          </div>
        </div>


      </div>
    </nav>
</template>





<script setup lang="ts">
import { useShabbatCountdown } from '~/composables/useShabbatCountdown'
import { useResearchOverlay } from '~/composables/useResearchOverlay'
import { useIsMobile } from '~/composables/useIsMobile'
const { text: shabbatText, isShabbat } = useShabbatCountdown()
const { toggle: openResearch, close: closeResearch, isOpen } = useResearchOverlay()
const { isMobile } = useIsMobile()
const navFontSize = computed(() => isMobile.value ? 18 : 24)
const route = useRoute()
const researchActive = computed(() => isOpen.value || route.path.startsWith('/design-time'))
const isInfoPage = computed(() => route.path.startsWith('/info'))

// Info: navigate directly. (The circles' swap animation that used to play before
// navigating from the home has been removed.)
function openInfo() {
  navigateTo('/info')
}
let userLocation: { latitude: number; longitude: number; city?: string } | null = null

/* ── Hide Research/Info on scroll-down, show on scroll-up ──
   Scrolling happens in different containers depending on page/viewport (the
   columns' inner scroller on desktop, the body on mobile, the object page's
   right column…). A capture-phase scroll listener on window catches scroll
   events from any of them as they propagate down to their target. */
// Shared so the footer can hide/show on scroll with the exact same signal.
const hiddenOnScroll = useState('uiScrollHidden', () => false)
// Shared "near the top of the page" flag — the footer uses it to stay hidden
// while at the top. Defaults to true (pages load scrolled to the top).
const atTop = useState('uiAtTop', () => true)
// Shared "near the bottom of the page" flag — the footer reappears there.
const atBottom = useState('uiAtBottom', () => false)
let lastY = 0
let lastTarget: EventTarget | null = null
let scrollTicking = false

function scrollTopOf(target: EventTarget | null): number {
  if (!target || target === document || target === window) {
    return window.scrollY || document.scrollingElement?.scrollTop || 0
  }
  return (target as HTMLElement).scrollTop ?? 0
}

// Visible viewport height and total scrollable height of the scrolling element,
// so we can tell when it's scrolled to the bottom.
function scrollSizeOf(target: EventTarget | null): { ch: number; sh: number } {
  if (!target || target === document || target === window) {
    const el = document.scrollingElement || document.documentElement
    return { ch: window.innerHeight, sh: el?.scrollHeight ?? 0 }
  }
  const el = target as HTMLElement
  return { ch: el.clientHeight, sh: el.scrollHeight }
}

function onScrollCapture(e: Event) {
  if (scrollTicking) return
  scrollTicking = true
  const target = e.target
  requestAnimationFrame(() => {
    scrollTicking = false
    const y = scrollTopOf(target)
    // Within the top offset → "at top" (footer stays hidden there).
    atTop.value = y <= 80
    // Within the bottom offset → "at bottom" (footer reappears there).
    const { ch, sh } = scrollSizeOf(target)
    atBottom.value = sh - (y + ch) <= 80
    // Reset the baseline when the scrolling element changes (e.g. navigation).
    if (target !== lastTarget) {
      lastTarget = target
      lastY = y
      return
    }
    const dy = y - lastY
    if (Math.abs(dy) < 6) return            // ignore jitter
    if (dy > 0 && y > 80) hiddenOnScroll.value = true   // scrolling down, past a small offset
    else if (dy < 0)      hiddenOnScroll.value = false  // scrolling up
    lastY = y
  })
}

// Fetch Shabbat countdown on mount
onMounted(async () => {
  window.addEventListener('scroll', onScrollCapture, { capture: true, passive: true })

  // Query previews bypass the live geo + Hebcal lookup so nothing overwrites the
  // forced state (child mounts before app.vue's onMounted, so read the query
  // directly):
  //  • ?shabbat → force the real Shabbat look on.
  //  • ?dark    → dark aesthetic preview only; no Shabbat, no API.
  // NB: the real Shabbat lookup ALWAYS runs otherwise — the dark-mode toggle
  // (previewDark) must not disable the live Shabbat lock.
  if ('shabbat' in route.query) { isShabbat.value = true; return }
  if ('dark' in route.query) return

  // Get user's location first
  await getUserLocation()
  // Then fetch Shabbat times
  await updateShabbatCountdown()
  // Update every minute
  setInterval(updateShabbatCountdown, 60000)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScrollCapture, { capture: true } as EventListenerOptions)
})

// Get user's geolocation
async function getUserLocation() {
  try {
    // Try browser geolocation API first (most accurate)
    if ('geolocation' in navigator) {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 3600000 // Cache for 1 hour
        })
      })

      userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }

      console.log('Using browser geolocation:', userLocation)
      return
    }
  } catch (err) {
    console.log('Browser geolocation failed, falling back to IP-based location')
  }

  // Fallback 1: Use IP-based geolocation
  try {
    const response = await fetch('https://ipapi.co/json/')
    if (response.ok) {
      const data = await response.json()
      if (data.latitude && data.longitude) {
        userLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city
        }
        console.log('Using IP-based geolocation:', userLocation)
        return
      }
    }
  } catch (err) {
    console.log('IP geolocation failed, trying timezone fallback')
  }

  // Fallback 2: Estimate location from timezone
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    console.log('Detected timezone:', timezone)

    // Map common timezones to approximate coordinates
    const timezoneCoords: Record<string, { latitude: number; longitude: number; city: string }> = {
      // Europe
      'Europe/Paris': { latitude: 48.8566, longitude: 2.3522, city: 'Paris' },
      'Europe/London': { latitude: 51.5074, longitude: -0.1278, city: 'London' },
      'Europe/Berlin': { latitude: 52.5200, longitude: 13.4050, city: 'Berlin' },
      'Europe/Madrid': { latitude: 40.4168, longitude: -3.7038, city: 'Madrid' },
      'Europe/Rome': { latitude: 41.9028, longitude: 12.4964, city: 'Rome' },
      'Europe/Amsterdam': { latitude: 52.3676, longitude: 4.9041, city: 'Amsterdam' },
      'Europe/Brussels': { latitude: 50.8503, longitude: 4.3517, city: 'Brussels' },
      'Europe/Zurich': { latitude: 47.3769, longitude: 8.5417, city: 'Zurich' },

      // Americas
      'America/New_York': { latitude: 40.7128, longitude: -74.0060, city: 'New York' },
      'America/Los_Angeles': { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles' },
      'America/Chicago': { latitude: 41.8781, longitude: -87.6298, city: 'Chicago' },
      'America/Toronto': { latitude: 43.6532, longitude: -79.3832, city: 'Toronto' },
      'America/Mexico_City': { latitude: 19.4326, longitude: -99.1332, city: 'Mexico City' },

      // Middle East
      'Asia/Jerusalem': { latitude: 31.7683, longitude: 35.2137, city: 'Jerusalem' },
      'Asia/Tel_Aviv': { latitude: 32.0853, longitude: 34.7818, city: 'Tel Aviv' },

      // Asia Pacific
      'Asia/Tokyo': { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo' },
      'Asia/Shanghai': { latitude: 31.2304, longitude: 121.4737, city: 'Shanghai' },
      'Asia/Singapore': { latitude: 1.3521, longitude: 103.8198, city: 'Singapore' },
      'Australia/Sydney': { latitude: -33.8688, longitude: 151.2093, city: 'Sydney' },
    }

    if (timezoneCoords[timezone]) {
      userLocation = timezoneCoords[timezone]
      console.log('Using timezone-based location estimate:', userLocation)
      return
    }
  } catch (err) {
    console.log('Timezone fallback failed')
  }

  // Fallback 3 (always succeeds): estimate longitude from the UTC offset
  // (~15°/hour) for any timezone not in the map above, with a central-Europe-ish
  // default latitude. Rough, but enough to compute plausible Shabbat times so the
  // mode never silently stays off just because no precise location was found.
  try {
    const offsetMin = new Date().getTimezoneOffset() // minutes behind UTC (UTC+2 → -120)
    userLocation = { latitude: 47, longitude: -offsetMin / 4, city: 'estimated' }
    console.log('Using UTC-offset location estimate:', userLocation)
    return
  } catch (err) {
    console.log('UTC-offset estimate failed')
  }

  console.log('All geolocation methods failed')
}

async function updateShabbatCountdown() {
  if (!userLocation) return

  try {
    // Hebcal now requires an explicit `tzid` when querying by lat/long — without
    // it the API returns HTTP 400 ("Timezone required") and the countdown never
    // updates. Use the browser timezone (falling back to UTC if unavailable).
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const url = `https://www.hebcal.com/shabbat?cfg=json&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&tzid=${encodeURIComponent(timeZone)}&b=18&M=on&leyning=off`

    const response = await fetch(url)
    if (!response.ok) return

    const data = await response.json()
    const items = data.items

    if (!items || items.length === 0) return

    const now = new Date()

    // Weekly Shabbat only — ignore religious-holiday (Yom Tov) candle-lighting
    // and havdalah that the Shabbat API also returns. Shabbat candle-lighting is
    // always on a Friday (day 5) and havdalah on a Saturday (day 6).
    const isFriday   = (d: Date) => d.getDay() === 5
    const isSaturday = (d: Date) => d.getDay() === 6

    const isShabbatCandle   = (item: any) => item.category === 'candles'   && isFriday(new Date(item.date))
    const isShabbatHavdalah = (item: any) => item.category === 'havdalah' && isSaturday(new Date(item.date))

    // Find candle lighting and havdalah times
    const candleLighting = items.find((item: any) =>
      isShabbatCandle(item) && new Date(item.date) > now
    )
    const havdalah = items.find((item: any) =>
      isShabbatHavdalah(item) && new Date(item.date) > now
    )

    // Check if we're currently in Shabbat (most recent past Friday candle-lighting)
    const previousCandleLighting = items.findLast((item: any) =>
      isShabbatCandle(item) && new Date(item.date) <= now
    )

    // Default to "not Shabbat"; the active branch below flips it back on.
    isShabbat.value = false

    if (previousCandleLighting && havdalah) {
      const candleTime = new Date(previousCandleLighting.date)
      const havdalahTime = new Date(havdalah.date)

      // If we're between candle lighting and havdalah, Shabbat is active
      if (now >= candleTime && now < havdalahTime) {
        isShabbat.value = true
        const timeDiff = havdalahTime.getTime() - now.getTime()
        const hours = Math.floor(timeDiff / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

        const hourText = hours === 1 ? 'hour' : 'hours'
        const minuteText = minutes === 1 ? 'minute' : 'minutes'

        if (hours > 0) {
          shabbatText.value = `Weekly Timescape\nends in ${hours} ${hourText}, ${minutes} ${minuteText}`
        } else {
          shabbatText.value = `Weekly Timescape\nends in ${minutes} ${minuteText}`
        }
        return
      }
    }

    // If not in Shabbat, show countdown to next Shabbat
    if (!candleLighting) return

    const shabbatStart = new Date(candleLighting.date)
    const timeDiff = shabbatStart.getTime() - now.getTime()

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

    const dayText = days === 1 ? 'day' : 'days'
    const hourText = hours === 1 ? 'hour' : 'hours'
    const minuteText = minutes === 1 ? 'minute' : 'minutes'

    if (days > 0) {
      shabbatText.value = `Weekly Timescape\nin ${days} ${dayText}, ${hours} ${hourText}, ${minutes} ${minuteText}`
    } else if (hours > 0) {
      shabbatText.value = `Weekly Timescape\nin ${hours} ${hourText}, ${minutes} ${minuteText}`
    } else {
      shabbatText.value = `Weekly Timescape\nin ${minutes} ${minuteText}`
    }
  } catch (err) {
    // Silent fail - keep default text
  }
}
</script>





<style lang="scss" scoped >
.v-nav {
  width: 100%;
  position: relative;
  // Prevent SVG stickers from horizontally overflowing the viewport
  overflow-x: hidden;
  // Sticker text inherits font-weight from its container — bold for nav
  font-weight: 700;

  // Mobile: stack the rows — shabbat countdown on top, Research + Info below
  @media (max-width: 768px) {
    :deep(.app-grid--justify-between) {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
  }
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

// Desktop: when the Research overlay is open, hide the Research + Info buttons
// (the overlay has its own close button in the top-right). Fade matches the
// overlay's own 0.3s opacity transition. On mobile the overlay covers the
// whole nav anyway, so we leave the buttons untouched there.
.nav-right {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.nav-right--hidden {
  @media (min-width: 769px) {
    opacity: 0;
    pointer-events: none;
  }
}

.nav-right__grid {
    transform: translate3d(0, -12px, 0);

    @media (max-width: 768px) {
        transform: translate3d(0, -10px, 0);
    }
}

// Hidden while scrolling down, slides back in on scroll up — mobile only.
// On desktop the Research/Info buttons stay put while scrolling.
.nav-right--scroll-hidden {
  @media (max-width: 768px) {
    opacity: 0;
    pointer-events: none;
    transform: translateY(-0.5rem);
  }
}

// Shabbat: the navigation is dimmed and not interactive (the site stays on the
// home — other pages are inaccessible during Shabbat).
.nav-right--locked {
  opacity: 0.35;
  pointer-events: none;
}

// Shabbat: the left "Weekly Timescape" button is also non-interactive.
.nav-left--locked {
  pointer-events: none;
}

.v-nav__infos {
  position: absolute;
  top: var(--app-gutter);
  left: var(--app-gutter);
  width: 30rem;
  background: hsla(0, 0%, 0%, 0.25);
  border-radius: .75rem;
  color: white;
  padding: 5rem .75rem .75rem;
  z-index: 0;
}

.infos-is-open {
  background: transparent;
  transition: none;
  backdrop-filter: none;

  .toggle-infos {
    transform: rotate(45deg);
  }
}
</style>
