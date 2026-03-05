<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CMS_API_ImageInstance } from '#shared/cms_api'

const props = defineProps<{
  // Pour images Kirby
  image?: CMS_API_ImageInstance
  imageHover?: CMS_API_ImageInstance
  size?: 'tiny' | 'small' | 'reg' | 'large' | 'xxl'
  // Pour URLs simples
  src?: string
  srcHover?: string
  alt?: string
  // Taille du blob
  blobSize?: number
}>()

const containerRef = ref<HTMLDivElement | null>(null)
const mouseX = ref(50)
const mouseY = ref(50)
const isHovering = ref(false)

const baseSrc = computed(() => {
  if (props.src) return props.src
  if (props.image) return props.image[props.size || 'reg'].url
  return ''
})

const hoverSrc = computed(() => {
  if (props.srcHover) return props.srcHover
  if (props.imageHover) return props.imageHover[props.size || 'reg'].url
  return ''
})

const altText = computed(() => {
  if (props.alt) return props.alt
  if (props.image) return props.image.alt || ''
  return ''
})

const blobRadius = computed(() => props.blobSize || 150)

const maskStyle = computed(() => {
  return {
    maskImage: `radial-gradient(circle ${blobRadius.value}px at ${mouseX.value}% ${mouseY.value}%, black 80%, transparent 100%)`,
    WebkitMaskImage: `radial-gradient(circle ${blobRadius.value}px at ${mouseX.value}% ${mouseY.value}%, black 80%, transparent 100%)`
  }
})

const onMouseMove = (e: MouseEvent) => {
  if (!containerRef.value) return
  const rect = containerRef.value.getBoundingClientRect()
  mouseX.value = ((e.clientX - rect.left) / rect.width) * 100
  mouseY.value = ((e.clientY - rect.top) / rect.height) * 100
}

const onMouseEnter = () => {
  isHovering.value = true
}

const onMouseLeave = () => {
  isHovering.value = false
}
</script>

<template>
  <div
    ref="containerRef"
    class="image-hover"
    @mousemove="onMouseMove"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <img :src="baseSrc" :alt="altText" class="image-hover__base" />
    <img
      :src="hoverSrc"
      :alt="altText"
      class="image-hover__reveal"
      :class="{ 'is-hovering': isHovering }"
      :style="maskStyle"
    />
  </div>
</template>

<style scoped>
.image-hover {
  position: relative;
  display: inline-block;
  cursor: none;
}

.image-hover__base,
.image-hover__reveal {
  display: block;
  width: 100%;
  height: auto;
}

.image-hover__reveal {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  pointer-events: none;
}

.image-hover__reveal.is-hovering {
  opacity: 1;
}
</style>
