<template>
	<section class="v-block block-article-heading app-grid app-grid--align-start" >

    <div class="app-grid app-grid--align-start app-grid--justify-center">
      <header v-if="block_data.content.title"
              :class="{
                'app-grid__col-6': block_data.content.text
              }"
      >
        <div class="app-grid app-grid--align-start app-grid--justify-center app-rm-child-margin">
          <h2
            ref="headingRef"
            :class="{
                'app-text-align-center': !block_data.content.text
            }"
          ><StickerParagraph :text="block_data.content.title" :max_width="headingMaxWidth" /></h2>
        </div>
      </header>

      <div v-if="block_data.content.text"
           :class="{
              'app-grid__col-6': block_data.content.title,
              'app-grid__col-12': !block_data.content.title,
            }"
      >
        <div v-html="block_data.content.text"/>
      </div>
    </div>

	</section>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
	import type {CMS_BlockArticleHeadingData} from "#shared/cms_api"

	defineProps<{
		block_data: CMS_BlockArticleHeadingData
	}>()

	// Measure the heading's own width so the sticker title wraps to it (instead of
	// the 600px / viewport default) and never gets clipped as the column narrows.
	const headingRef = ref<HTMLElement | null>(null)
	const headingWidth = ref(600)
	const headingMaxWidth = computed(() => Math.max(160, headingWidth.value - 8))
	let ro: ResizeObserver | null = null
	onMounted(() => {
		if (headingRef.value && typeof ResizeObserver !== 'undefined') {
			ro = new ResizeObserver((entries) => {
				const w = entries[0]?.contentRect.width
				if (w && w > 0) headingWidth.value = w
			})
			ro.observe(headingRef.value)
		}
	})
	onBeforeUnmount(() => { ro?.disconnect(); ro = null })
</script>

<style scoped lang="scss">
.block-article-heading {
  width: 100%;
  box-sizing: border-box;
  min-height: calc(100vh - 20rem);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
