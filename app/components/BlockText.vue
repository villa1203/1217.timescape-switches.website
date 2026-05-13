<template>
	<section class="v-block block-text">
		<div v-if="block_data.content.title">
			<h2>
				<StickerParagraph
					:text="block_data.content.title"
					:variant="sticker ? 'secondary' : undefined"
				/>
			</h2>
		</div>

		<div class="block-text__body" ref="bodyRef">
			<template v-if="sticker">
				<div class="block-text__body--sticker body-1">
					<StickerParagraph
						v-for="(p, i) in stickerParagraphs"
						:key="i"
						:text="p"
						:font_size="20"
						:max_width="bodyWidth"
						variant="secondary"
					/>
				</div>
			</template>
			<div v-else v-html="block_data.content.text"/>
		</div>
	</section>

</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import type {CMS_BlockTextData} from "#shared/cms_api";

const props = defineProps<{
  block_data: CMS_BlockTextData
  sticker?: boolean
}>()

const bodyRef = ref<HTMLElement | null>(null)
const bodyWidth = ref(600)
let ro: ResizeObserver | null = null

onMounted(() => {
  if (!bodyRef.value || typeof ResizeObserver === 'undefined') return
  ro = new ResizeObserver(entries => {
    for (const e of entries) {
      const w = e.contentRect.width
      if (w > 0) bodyWidth.value = w
    }
  })
  ro.observe(bodyRef.value)
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

// When `sticker` is on, split the body HTML into plain-text chunks per <p>/<h*>/<li>
// so each becomes its own StickerParagraph (which wraps based on measured width).
const stickerParagraphs = computed(() => {
  if (!props.sticker || !props.block_data.content.text) return []
  const html = props.block_data.content.text
  const blockRe = /<(p|h[1-6]|li)[^>]*>([\s\S]*?)<\/\1>/gi
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = blockRe.exec(html))) {
    const inner = m[2] ?? ''
    const text = inner
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) out.push(text)
  }
  return out
})
</script>

<style scoped lang="scss">
.block-text {
  width: 100%;
  box-sizing: border-box;
}

.block-text__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.block-text__body :deep(p) {
  text-indent: 2rem;
}

.block-text__body--sticker {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
