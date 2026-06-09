<template>
	<section v-if="block_data.content.image?.large?.url"
           class="v-block block-image"
           :class="{
              'is-full':      block_data.content.toggle_is_full === 'true',
              'has-gap-left': block_data.content.toggle_gap_left === 'true',
              'has-ratio-1-1': block_data.content.toggle_ratio_1_1 === 'true',
              'is-large':     block_data.content.toggle_is_large === 'true',
           }"
  >
		<header v-if="block_data.content.title">
			<h2 class="h2 purple"><StickerParagraph :text="block_data.content.title" /></h2>
		</header>
		<ObjectImage
		  :image="block_data.content.image"
		  :alt="block_data.content.image.alt || 'image'"
		  :caption="captionHtml"
		/>
	</section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type {CMS_BlockImageData} from "#shared/cms_api"

const props = defineProps<{
  block_data: CMS_BlockImageData
}>()

const captionHtml = computed(() => {
  const parts: string[] = []
  if (props.block_data.content.caption) {
    parts.push(`<div class="app-text-strong">${props.block_data.content.caption}</div>`)
  }
  if (props.block_data.content.credits) {
    parts.push(`<div>${props.block_data.content.credits}</div>`)
  }
  return parts.join('')
})
</script>

<style scoped lang="scss">
.block-image {
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.has-ratio-1-1 :deep(.object-image__img) {
  aspect-ratio: 1/1;
  object-fit: cover;
}

</style>
