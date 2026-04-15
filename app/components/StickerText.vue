<script setup lang="ts">
import { computed, ref, onMounted, watch, useId } from 'vue'

const props = defineProps<{
  text: string
  color?: string
  variant?: 'primary' | 'secondary'
  strokeWidth?: number
  fontSize?: number
}>()

const uid = useId()
const textRef = ref<SVGTextElement | null>(null)
const textWidth = ref(300)

const strokeColor = computed(() => {
  if (props.color) return props.color
  if (props.variant === 'secondary') return 'var(--app-color-secondary)'
  return 'var(--app-color-primary)'
})
const bgColor = '#ffffff'

const svgWidth = computed(() => textWidth.value + (props.strokeWidth || 35) + 40)
const svgHeight = computed(() => (props.fontSize || 50) * 1.5)
const viewBox = computed(() => `0 0 ${svgWidth.value} ${svgHeight.value}`)

const updateWidth = () => {
  if (textRef.value) {
    const bbox = textRef.value.getBBox()
    textWidth.value = bbox.width
  }
}

onMounted(() => {
  updateWidth()
})

watch(() => props.text, () => {
  setTimeout(updateWidth, 0)
})
</script>

<template>
  <span class="sticker-container">
    <svg
      class="sticker-svg"
      :viewBox="viewBox"
      :style="{ width: `${svgWidth}px` }"
    >
      <defs>
        <filter :id="`glow-blur-${uid}`" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
        </filter>
      </defs>

      <!-- Fond extérieur coloré -->
      <text
        class="svg-text"
        x="30"
        :y="(fontSize || 50) * 1.1"
        :style="{
          fontSize: `${fontSize || 50}px`,
          fill: strokeColor,
          stroke: strokeColor,
          strokeWidth: `${strokeWidth || 35}px`
        }"
      >{{ text }}</text>

      <!-- Glow blanc flou (ultra léger) -->
      <text
        class="svg-text"
        x="30"
        :y="(fontSize || 50) * 1.1"
        :style="{
          fontSize: `${fontSize || 50}px`,
          fill: 'transparent',
          stroke: bgColor,
          strokeWidth: `${(strokeWidth || 35) - 2}px`,
          filter: `url(#glow-blur-${uid})`,
          opacity: 0.15
        }"
      >{{ text }}</text>

      <!-- Glow blanc flou (très léger) -->
      <text
        class="svg-text"
        x="30"
        :y="(fontSize || 50) * 1.1"
        :style="{
          fontSize: `${fontSize || 50}px`,
          fill: 'transparent',
          stroke: bgColor,
          strokeWidth: `${(strokeWidth || 35) - 5}px`,
          filter: `url(#glow-blur-${uid})`,
          opacity: 0.3
        }"
      >{{ text }}</text>

      <!-- Glow blanc flou (léger) -->
      <text
        class="svg-text"
        x="30"
        :y="(fontSize || 50) * 1.1"
        :style="{
          fontSize: `${fontSize || 50}px`,
          fill: 'transparent',
          stroke: bgColor,
          strokeWidth: `${(strokeWidth || 35) - 8}px`,
          filter: `url(#glow-blur-${uid})`,
          opacity: 0.5
        }"
      >{{ text }}</text>

      <!-- Glow blanc flou (moyen) -->
      <text
        class="svg-text"
        x="30"
        :y="(fontSize || 50) * 1.1"
        :style="{
          fontSize: `${fontSize || 50}px`,
          fill: 'transparent',
          stroke: bgColor,
          strokeWidth: `${(strokeWidth || 35) - 12}px`,
          filter: `url(#glow-blur-${uid})`,
          opacity: 0.7
        }"
      >{{ text }}</text>

      <!-- Glow blanc flou (plus fort) -->
      <text
        class="svg-text"
        x="30"
        :y="(fontSize || 50) * 1.1"
        :style="{
          fontSize: `${fontSize || 50}px`,
          fill: 'transparent',
          stroke: bgColor,
          strokeWidth: `${(strokeWidth || 35) - 16}px`,
          filter: `url(#glow-blur-${uid})`,
          opacity: 0.9
        }"
      >{{ text }}</text>

      <!-- Centre blanc propre -->
      <text
        class="svg-text"
        x="30"
        :y="(fontSize || 50) * 1.1"
        :style="{
          fontSize: `${fontSize || 50}px`,
          fill: bgColor,
          stroke: bgColor,
          strokeWidth: `${(strokeWidth || 35) - 20}px`
        }"
      >{{ text }}</text>

      <!-- Texte -->
      <text
        ref="textRef"
        class="svg-text"
        x="30"
        :y="(fontSize || 50) * 1.1"
        :style="{
          fontSize: `${fontSize || 50}px`,
          fill: strokeColor,
          stroke: 'transparent'
        }"
      >{{ text }}</text>
    </svg>
  </span>
</template>

<style scoped>
.sticker-container {
  display: inline-block;
  vertical-align: middle;
}

.sticker-svg {
  display: block;
  height: auto;
  overflow: visible;
}

.svg-text {
  font-family: inherit;
  font-style: inherit;
  font-weight: inherit;
  stroke-linejoin: round;
  paint-order: stroke;
}
</style>
