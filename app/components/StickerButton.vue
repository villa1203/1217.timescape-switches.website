<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  text: string
  to?: string
  href?: string
  color?: string
  hoverColor?: string
  strokeWidth?: number
  fontSize?: number
}>()

const isHovered = ref(false)
const isNuxtLink = computed(() => !!props.to)
const isExternalLink = computed(() => !!props.href)

const activeColor = computed(() => {
  if (isHovered.value) {
    return props.hoverColor || 'var(--app-color-secondary)'
  }
  return props.color || 'var(--app-color-primary)'
})
</script>

<template>
  <nuxt-link
    v-if="isNuxtLink"
    :to="to"
    class="sticker-button"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <StickerText
      :text="text"
      :color="activeColor"
      :stroke-width="strokeWidth"
      :font-size="fontSize"
    />
  </nuxt-link>

  <a
    v-else-if="isExternalLink"
    :href="href"
    class="sticker-button"
    target="_blank"
    rel="noopener"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <StickerText
      :text="text"
      :color="activeColor"
      :stroke-width="strokeWidth"
      :font-size="fontSize"
    />
  </a>

  <button
    v-else
    class="sticker-button"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <StickerText
      :text="text"
      :color="activeColor"
      :stroke-width="strokeWidth"
      :font-size="fontSize"
    />
  </button>
</template>

<style scoped>
.sticker-button {
  display: inline-block;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s ease;
}

.sticker-button:hover {
  transform: scale(1.05);
}
</style>
