<template>
  <span v-if="countdownText">{{ countdownText }}</span>
  <span v-else>Loading...</span>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  // Minutes before sunset for candle lighting
  candleLightingMinutes: {
    type: Number,
    default: 18
  }
})

const countdownText = ref('Weekly Timescape')
let intervalId = null
let userLocation = null

// Get user's geolocation
async function getUserLocation() {
  try {
    // Try browser geolocation API first (most accurate)
    if ('geolocation' in navigator) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 3600000 // Cache for 1 hour
        })
      })

      userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      }

      console.log('ShabbatCountdown using browser geolocation:', userLocation)
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
        console.log('ShabbatCountdown using IP-based geolocation:', userLocation)
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
    const timezoneCoords = {
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
      console.log('ShabbatCountdown using timezone-based location estimate:', userLocation)
      return
    }
  } catch (err) {
    console.log('Timezone fallback failed')
  }

  console.log('All geolocation methods failed')
}

// Fetch Shabbat times from Hebcal API
async function fetchShabbatTimes() {
  if (!userLocation) return null

  try {
    const url = `https://www.hebcal.com/shabbat?cfg=json&latitude=${userLocation.latitude}&longitude=${userLocation.longitude}&b=${props.candleLightingMinutes}&M=on&leyning=off`
    const response = await fetch(url)
    if (!response.ok) return null
    const data = await response.json()
    return data.items
  } catch (err) {
    return null
  }
}

// Calculate countdown to next Shabbat and format as text
function formatCountdown(items) {
  if (!items || items.length === 0) return ''

  const now = new Date()

  // Find candle lighting and havdalah times
  const candleLighting = items.find(item =>
    item.category === 'candles' && new Date(item.date) > now
  )
  const havdalah = items.find(item =>
    item.category === 'havdalah' && new Date(item.date) > now
  )

  // Check if we're currently in Shabbat
  const previousCandleLighting = items.find(item =>
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
        return `You entered a Timescape, it will end in ${hours} ${hourText}, ${minutes} ${minuteText}`
      } else {
        return `You entered a Timescape, it will end in ${minutes} ${minuteText}`
      }
    }
  }

  // If not in Shabbat, show countdown to next Shabbat
  if (!candleLighting) return 'Weekly Timescape'

  const shabbatStart = new Date(candleLighting.date)
  const timeDiff = shabbatStart - now

  const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))

  const dayText = days === 1 ? 'day' : 'days'
  const hourText = hours === 1 ? 'hour' : 'hours'
  const minuteText = minutes === 1 ? 'minute' : 'minutes'

  if (days > 0) {
    return `Weekly Timescape in ${days} ${dayText}, ${hours} ${hourText}, ${minutes} ${minuteText}`
  } else if (hours > 0) {
    return `Weekly Timescape in ${hours} ${hourText}, ${minutes} ${minuteText}`
  } else {
    return `Weekly Timescape in ${minutes} ${minuteText}`
  }
}

// Update countdown every minute
async function updateCountdown() {
  const items = await fetchShabbatTimes()
  if (items) {
    countdownText.value = formatCountdown(items)
  }
}

onMounted(async () => {
  // Get user's location first
  await getUserLocation()
  // Then fetch Shabbat times
  await updateCountdown()

  // Update countdown every minute
  intervalId = setInterval(updateCountdown, 60000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
})
</script>

<style scoped>
/* No additional styles needed - inherits from StickerButton */
</style>
