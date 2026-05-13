<template>
  <select v-model="selectedLocation" @change="onLocationChange" class="location-dropdown">
    <option value="auto">Auto-detect</option>
    <option value="jerusalem">Jerusalem</option>
    <option value="newyork">New York</option>
    <option value="london">London</option>
    <option value="paris">Paris</option>
    <option value="losangeles">Los Angeles</option>
  </select>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  'location-change': [location: { latitude: number; longitude: number; city?: string } | null]
}>()

const selectedLocation = ref('auto')

const locationPresets: Record<string, { latitude: number; longitude: number; city: string }> = {
  jerusalem: { latitude: 31.7683, longitude: 35.2137, city: 'Jerusalem' },
  newyork: { latitude: 40.7128, longitude: -74.0060, city: 'New York' },
  london: { latitude: 51.5074, longitude: -0.1278, city: 'London' },
  paris: { latitude: 48.8566, longitude: 2.3522, city: 'Paris' },
  losangeles: { latitude: 34.0522, longitude: -118.2437, city: 'Los Angeles' }
}

async function onLocationChange() {
  if (selectedLocation.value === 'auto') {
    emit('location-change', null)
  } else {
    const preset = locationPresets[selectedLocation.value]
    if (preset) emit('location-change', preset)
  }
}
</script>

<style lang="scss" scoped>
.location-dropdown {
  padding: 0.5rem 1rem;
  border: 2px solid var(--app-color-primary);
  border-radius: 2rem;
  background: white;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--app-color-secondary);
    transform: translateY(-2px);
  }

  &:focus {
    border-color: var(--app-color-secondary);
  }
}
</style>
