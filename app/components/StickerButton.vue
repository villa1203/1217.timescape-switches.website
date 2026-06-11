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
  max_width?: number
  active?: boolean
  flip?: boolean   // invert the default state: filled by default, plain on hover
  blob_scale?: number  // forwarded to StickerParagraph — chunkier blob (nav/footer)
}>()

const isHovered = ref(false)
const isNuxtLink = computed(() => !!props.to)
const isExternalLink = computed(() => !!props.href)

const baseColor = computed(() => props.color || 'var(--app-color-primary)')
// Normally inverted on hover/active. With `flip` (e.g. Shabbat mode) the default
// is the inverted (purple-filled) look and hover/active flips back to plain.
const isInverted = computed(() => (isHovered.value || !!props.active) !== !!props.flip)
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
      :max_width="max_width"
      :blob_scale="blob_scale"
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
      :max_width="max_width"
      :blob_scale="blob_scale"
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
      :max_width="max_width"
      :blob_scale="blob_scale"
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
  /* <button> elements don't inherit font properties by default — opt back in
     so the nested StickerParagraph picks up the surrounding font-weight/family. */
  font: inherit;
}
</style>
