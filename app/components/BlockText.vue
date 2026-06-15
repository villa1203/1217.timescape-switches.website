<template>
	<section class="v-block block-text">
		<div v-if="block_data.content.title">
			<h2>
				<StickerParagraph
					:text="block_data.content.title"
					:variant="sticker ? 'secondary' : undefined"
					:max_width="bodyWidth"
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
						:fill_max_width="true"
						variant="secondary"
					/>
				</div>
			</template>
      <AppObfuscatedText
        v-else
        :text="block_data.content.text"
      />
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
  // Paragraph alinéa — also used to align bullet-list text. Keep both in sync.
  --block-text-indent: 2rem;

  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Spacing is CMS-driven: no imposed margins on the writer content, so the
   layout reflects exactly the line breaks (<br>) and paragraphs authored in
   the CMS. Add a blank line in the writer to get vertical space. */
/* Each paragraph end gets a gap below it, matching the paragraph spacing in
   the CMS writer. Empty paragraphs (blank lines) also get a line box so an
   extra blank line in the writer shows as extra space on the front. */
.block-text__body :deep(p) {
  text-indent: var(--block-text-indent);
  margin: 0 0 1rem;
}

/* No indent on the first paragraph of the text, nor on a paragraph that comes
   right after a heading — the indent only marks continuation paragraphs. */
.block-text__body :deep(p:first-child),
.block-text__body :deep(:is(h1, h2, h3, h4, h5, h6) + p) {
  text-indent: 0;
}

.block-text__body :deep(p:empty)::before {
  content: "\00a0";
}

/* CMS text links: brand violet instead of the browser default blue. */
.block-text__body :deep(a) {
  color: var(--app-color-primary);
  text-decoration: underline;
}

.block-text__body :deep(a:hover) {
  text-decoration: none;
}

.block-text__body :deep(ul),
.block-text__body :deep(ol) {
  margin: 0 0 1rem;
  padding-left: 0;
  list-style: none;
}

/* Bullet lines stay tight: no gap between list items or their inner text.
   The marker sits flush against the left margin and the text is pushed to the
   paragraph alinéa, so list text lines up with indented prose. */
.block-text__body :deep(li) {
  position: relative;
  margin: 0;
  padding-left: var(--block-text-indent);
}

.block-text__body :deep(ul > li)::before {
  content: "•";
  position: absolute;
  left: 0;
}

/* Ordered lists keep their numbering, also flush-left with text at the alinéa. */
.block-text__body :deep(ol) {
  counter-reset: ol-counter;
}

.block-text__body :deep(ol > li)::before {
  counter-increment: ol-counter;
  content: counter(ol-counter) ".";
  position: absolute;
  left: 0;
}

.block-text__body :deep(li p) {
  text-indent: 0;
  margin: 0;
}

.block-text__body--sticker {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
