<template>
	<section class="v-block block-gallery"
  >
		<header v-if="block_data.content.title">
			<h2 class="h2 purple"><StickerParagraph :text="block_data.content.title" /></h2>
		</header>

    <div class="app-grid app-grid--wrap">
			<img v-for="image of block_data.content.images"
           class="app-grid__col-6"
           :src="image.large.url"
           :srcset="buildSrcset(image) || undefined"
           sizes="(max-width: 768px) 46vw, 25vw"
           :alt="image.alt || 'image'"
           loading="lazy"
           decoding="async"
      >

    </div>
    <div v-if="block_data.content.caption" class="app-text-strong" v-html="block_data.content.caption"></div>
    <div v-if="block_data.content.credits" v-html="block_data.content.credits"></div>
	</section>
</template>

<script setup lang="ts">
import {buildSrcset, type CMS_BlockGalleryData} from "#shared/cms_api"

defineProps<{
  block_data: CMS_BlockGalleryData
}>()
</script>

<style scoped lang="scss">
.block-gallery {
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

img {
  box-sizing: border-box;
  display: block;
  margin: 0;
  max-height: calc(100vh - 4rem);
  object-fit: cover;
}

</style>
