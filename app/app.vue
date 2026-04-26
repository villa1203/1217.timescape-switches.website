<template>
  <div class="v-app" :class="{ 'v-app--dark': isDarkMode }"
  >

    <div class="v-app__header app-grid">
      <AppNav/>
    </div>

    <main>
      <NuxtPage :transition="{
        name: 'fade',
        mode: 'out-in'
        }" />
    </main>

    <div class="v-app__footer app-grid">
      <AppFooter/>
    </div>
  </div>
</template>


<script setup lang="ts">
const isDarkMode = ref(false)
let userLocation: { latitude: number; longitude: number; city?: string } | null = null

// Get user's geolocation (same as AppNav)
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

      console.log('App using browser geolocation:', userLocation)
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
        console.log('App using IP-based geolocation:', userLocation)
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
      console.log('App using timezone-based location estimate:', userLocation)
      return
    }
  } catch (err) {
    console.log('Timezone fallback failed')
  }

  console.log('All geolocation methods failed')
}

// Check if we're currently in Shabbat
async function checkShabbatStatus() {
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
    const previousCandleLighting = items.find((item: any) =>
      item.category === 'candles' && new Date(item.date) <= now
    )
    const havdalah = items.find((item: any) =>
      item.category === 'havdalah' && new Date(item.date) > now
    )

    // If we're between candle lighting and havdalah, Shabbat is active
    if (previousCandleLighting && havdalah) {
      const candleTime = new Date(previousCandleLighting.date)
      const havdalahTime = new Date(havdalah.date)

      if (now >= candleTime && now < havdalahTime) {
        isDarkMode.value = true
        console.log('Shabbat is active - dark mode ON')
        return
      }
    }

    // Not in Shabbat
    isDarkMode.value = false
    console.log('Shabbat is not active - dark mode OFF')
  } catch (err) {
    console.log('Failed to check Shabbat status:', err)
  }
}

onMounted(async () => {
  // Get user's location first
  await getUserLocation()
  // Check Shabbat status
  await checkShabbatStatus()
  // Check every minute
  setInterval(checkShabbatStatus, 60000)
})

useRouter().afterEach(() => {
  if (import.meta.client) {
    document.body.classList.remove('v-block--is-visible')
  }
})

</script>


<style lang="scss" scoped>
.v-app {
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
  padding-top: var(--app-header-height);
  padding-bottom: var(--app-footer-height);
  transition: background-color 0.8s ease;
}

.v-app--dark {
  background-color: #000000;

  /* Make all backgrounds black */
  :deep(*) {
    background-color: #000000 !important;
  }
}

.v-app__header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 100;
}

.v-app-footer {
  position: fixed;
  bottom: 0;
}


.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
