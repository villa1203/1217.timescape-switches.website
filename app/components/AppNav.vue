<template>
    <nav class="v-nav app-with-padding--left-right app-with-padding--top-bottom"
    >
      <div class="app-grid app-grid--justify-between">
        <div class="nav-left">
          <StickerButton :text="shabbatText" to="/" :font_size="24" />
        </div>

        <div>
          <div class="app-grid">
            <div>
              <StickerButton
                text="Research"
                @click="openResearch"
                :font_size="24"
                color="var(--app-color-primary)"
                :active="researchActive"
              />
            </div>

            <div>
              <StickerButton text="Info" to="/info" :font_size="24" :active="isInfoPage" />
            </div>
          </div>
        </div>


      </div>
    </nav>
</template>





<script setup lang="ts">
import { useShabbatCountdown } from '~/composables/useShabbatCountdown'
import { useResearchOverlay } from '~/composables/useResearchOverlay'

const { text: shabbatText } = useShabbatCountdown()
const { toggle: openResearch, isOpen } = useResearchOverlay()
const route = useRoute()
const researchActive = computed(() => isOpen.value || route.path.startsWith('/research'))
const isInfoPage = computed(() => route.path.startsWith('/info'))
let userLocation: { latitude: number; longitude: number; city?: string } | null = null

// Fetch Shabbat countdown on mount
onMounted(async () => {
  // Get user's location first
  await getUserLocation()
  // Then fetch Shabbat times
  await updateShabbatCountdown()
  // Update every minute
  setInterval(updateShabbatCountdown, 60000)
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

  console.log('All geolocation methods failed')
}

async function updateShabbatCountdown() {
  if (!userLocation) return

  try {
    const url = `https://www.hebcal.com/shabbat?cfg=json&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&b=18&M=on&leyning=off`

    const response = await fetch(url)
    if (!response.ok) return

    const data = await response.json()
    const items = data.items

    if (!items || items.length === 0) return

    const now = new Date()

    // Find candle lighting and havdalah times
    const candleLighting = items.find((item: any) =>
      item.category === 'candles' && new Date(item.date) > now
    )
    const havdalah = items.find((item: any) =>
      item.category === 'havdalah' && new Date(item.date) > now
    )

    // Check if we're currently in Shabbat
    const previousCandleLighting = items.find((item: any) =>
      item.category === 'candles' && new Date(item.date) <= now
    )

    if (previousCandleLighting && havdalah) {
      const candleTime = new Date(previousCandleLighting.date)
      const havdalahTime = new Date(havdalah.date)

      // If we're between candle lighting and havdalah, Shabbat is active
      if (now >= candleTime && now < havdalahTime) {
        const timeDiff = havdalahTime.getTime() - now.getTime()
        const hours = Math.floor(timeDiff / (1000 * 60 * 60))
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

        const hourText = hours === 1 ? 'hour' : 'hours'
        const minuteText = minutes === 1 ? 'minute' : 'minutes'

        if (hours > 0) {
          shabbatText.value = `You entered a Timescape,\nit will end in ${hours} ${hourText}, ${minutes} ${minuteText}`
        } else {
          shabbatText.value = `You entered a Timescape,\nit will end in ${minutes} ${minuteText}`
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
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
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
