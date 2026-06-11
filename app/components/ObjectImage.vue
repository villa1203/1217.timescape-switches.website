<template>
  <figure class="object-image">
    <img
      :src="resolvedSrc"
      :srcset="srcset || undefined"
      :sizes="srcset ? sizes : undefined"
      :width="image?.large?.width || undefined"
      :height="image?.large?.height || undefined"
      :alt="alt || ''"
      loading="lazy"
      decoding="async"
      class="object-image__img"
    />
    <figcaption v-if="caption" class="object-image__caption caption" v-html="caption" />
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { buildSrcset, type CMS_API_ImageInstance } from '#shared/cms_api'

// Pass `image` (CMS instance) for a responsive srcset; `src` stays as a plain
// fallback. `sizes` describes the rendered width so the browser picks the right
// source — default tuned for the object-page content column.
const props = withDefaults(defineProps<{
  image?: CMS_API_ImageInstance | null
  src?: string
  alt?: string
  caption?: string
  sizes?: string
}>(), {
  sizes: '(max-width: 768px) 92vw, 32vw',
})

const srcset = computed(() => buildSrcset(props.image))
const resolvedSrc = computed(() =>
  props.image?.large?.url || props.image?.reg?.url || props.src || '',
)
</script>

<style scoped lang="scss">
.object-image {
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.object-image__img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1.5rem;
  object-fit: cover;
}

.object-image__caption {
  margin-top: 0.75rem;
  // Flush-left under the image: stretch to the full image width (the figure
  // itself is centered) and left-align so the text's left edge lines up with
  // the image's left edge.
  align-self: stretch;
  text-align: left;
  // A touch smaller than the global .caption size (1.2rem).
  font-size: 1rem;

  // Caption (légende) is upright and not bold; only the credits below stay
  // italic (inherited from the global .caption rule).
  :deep(.app-text-strong) {
    font-style: normal;
    font-weight: 400;
  }
}
</style>
