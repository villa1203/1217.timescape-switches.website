<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  text: string
  to?: string
  href?: string
  color?: string
  hoverColor?: string
  stroke_width?: number
  font_size?: number
  active?: boolean
}>()

const isHovered = ref(false)
const isNuxtLink = computed(() => !!props.to)
const isExternalLink = computed(() => !!props.href)

const baseColor = computed(() => props.color || 'var(--app-color-primary)')
const isInverted = computed(() => isHovered.value || !!props.active)
</script>

<template>
  <nuxt-link
    v-if="isNuxtLink"
    :to="to"
    class="sticker-button"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <StickerParagraph
      :text="text"
      :color="baseColor"
      :inverted="isInverted"
      :stroke_width="stroke_width"
      :font_size="font_size"
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
    <StickerParagraph
      :text="text"
      :color="baseColor"
      :inverted="isInverted"
      :stroke_width="stroke_width"
      :font_size="font_size"
    />
  </a>

  <button
    v-else
    class="sticker-button"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <StickerParagraph
      :text="text"
      :color="baseColor"
      :inverted="isInverted"
      :stroke_width="stroke_width"
      :font_size="font_size"
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
</style>
