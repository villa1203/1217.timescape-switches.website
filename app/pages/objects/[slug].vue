<template>
  <main class="v-slug">
    <div class="v-slug__layout">

      <!-- Left: 3D viewer — hover reveals the transparent xray (mode='normal') -->
      <div class="v-slug__left">
        <div class="viewer-section">
          <!-- Mount only once the CMS model URL is available; otherwise the
               component would load its (now-removed) /public fallback and 404. -->
          <component
            v-if="threeComponent && data?.result.model?.url"
            :is="threeComponent"
            :mode="transparentOn ? 'glass' : 'normal'"
            :src="data?.result.model?.url"
          />
          <DarkModeToggle />
        </div>
      </div>

      <!-- Right: text content with independent scroll + edge fade -->
      <div class="v-slug__right">
        <h1 v-if="data?.result.title" class="v-slug__title">
          <!-- Title fills violet while the 3D transparent (glass) mode is on. -->
          <StickerParagraph :text="data.result.title" :font_size="48" :line_height="1.0" :inverted="transparentOn" />
        </h1>
        <p v-if="data?.result.baseline" class="v-slug__baseline">{{ data.result.baseline }}</p>

        <div class="v-slug__meta">
          <div>
            <h3 class="v-slug__meta__title">
              <StickerParagraph text="Temporal Strategies" size="sm" />
            </h3>
            <div class="v-slug__meta__value" v-html="data?.result.strategies" />
          </div>
        </div>

        <div v-if="data?.result.content">
          <Blocks :content="data.result.content"/>
        </div>

        <nav class="v-slug__nav">
          <StickerButton
            text="← Previous"
            :to="`/objects/${prevObject.slug}`"
            :font_size="20"
          />
          <StickerButton
            text="Next →"
            :to="`/objects/${nextObject.slug}`"
            :font_size="20"
          />
        </nav>
      </div>

    </div>
  </main>
</template>


<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useTransparentMode } from '~/composables/useTransparentMode'
import {KQL_PROJECTS_SELECT, seoSelect, siteSeoSelect} from "#shared/KQLQueries";
import { useCmsSeo, type CmsSeoFields, type CmsSiteSeo } from "~/composables/useCmsSeo";
import type {CMS_API_ImageInstance, CMS_API_Response, CMS_BlockData} from "#shared/cms_api";

type FetchData = CMS_API_Response & {
  "result": {
    title: string,
    slug: string,
    content: CMS_BlockData[],
    strategies: string
    baseline: string
    cover_front: CMS_API_ImageInstance[]
    cover_back: CMS_API_ImageInstance[]
    // 3D model file uploaded in the CMS (model_3d tab). Null when none set.
    model: { url: string, filename: string } | null
    site: CmsSiteSeo
  } & CmsSeoFields
}

const route = useRoute()

const {data} = await useFetch<FetchData>('/api/CMS_KQLRequest', {
  // Not lazy: SEO meta must be in the server-rendered HTML for crawlers.
  method: 'POST',
  body: {
    query: `page('objects/${route.params.slug}')`,
    select: {
      ...KQL_PROJECTS_SELECT,
      ...seoSelect('page'),
      site: { query: 'site', select: siteSeoSelect() },
    },
  }
})

useCmsSeo(() => ({
  page: data.value?.result,
  site: data.value?.result?.site,
  path: `/objects/${route.params.slug}`,
  fallbackTitle: data.value?.result?.title,
  fallbackDescription: data.value?.result?.baseline,
}))

// Map CMS slug → 3D component (same mapping as ResearchOverlay)
const threeBySlug: Record<string, ReturnType<typeof defineAsyncComponent>> = {
  'shabbat-kettle':            defineAsyncComponent(() => import('~/components/ThreeKettle.vue')),
  'kosher-switch':             defineAsyncComponent(() => import('~/components/ThreeSwitch.vue')),
  'shabbat-mode-refrigerator': defineAsyncComponent(() => import('~/components/ThreeFridge.vue')),
  'elevator':                  defineAsyncComponent(() => import('~/components/ThreeElevator.vue')),
  'plug-in-timer':             defineAsyncComponent(() => import('~/components/ThreePlugtimer.vue')),
  'kosher-lamp':               defineAsyncComponent(() => import('~/components/ThreeLamp.vue')),
}

const threeComponent = computed(() => threeBySlug[route.params.slug as string] ?? null)

const { isOn: transparentOn } = useTransparentMode()

// Ordered list of objects for prev/next navigation (same order as ResearchOverlay)
const objectsOrder = [
  { slug: 'shabbat-kettle',            label: 'Kettle' },
  { slug: 'kosher-switch',             label: 'Kosher Switch' },
  { slug: 'shabbat-mode-refrigerator', label: 'Shabbat Refrigerator' },
  { slug: 'elevator',                  label: 'Elevator' },
  { slug: 'plug-in-timer',             label: 'Plug Timer' },
  { slug: 'kosher-lamp',               label: 'Kosher Lamp' },
]

const currentIndex = computed(() => {
  const i = objectsOrder.findIndex(o => o.slug === route.params.slug)
  return i === -1 ? 0 : i
})
const prevObject = computed(() => objectsOrder[(currentIndex.value - 1 + objectsOrder.length) % objectsOrder.length]!)
const nextObject = computed(() => objectsOrder[(currentIndex.value + 1) % objectsOrder.length]!)
</script>


<style lang="scss" scoped>
/* Mirrors ResearchOverlay's .overlay-body grid (full viewport, 1fr 1fr). */
.v-slug__layout {
  position: relative;
  height: calc(100vh - var(--app-header-height, 0px) - var(--app-footer-height, 0px));

  // Mobile: drop the fixed-height constraint so the columns can stack and grow
  @media (max-width: 768px) {
    height: auto;
  }
}

/* Left: 3D — full viewport height, fixed to the left half so it lives
   behind the header/footer just like the overlay (which sits on top of the
   page chrome at z-index 200). */
.v-slug__left {
  position: fixed;
  top: 0;
  left: 0;
  width: 50vw;
  height: 100vh;
  overflow: hidden;
  z-index: 0;

  // Mobile: full-width block on top, in normal flow (not fixed)
  @media (max-width: 768px) {
    position: relative;
    width: 100%;
    height: 60vh;
  }
}

/* Same shape as the old info.vue viewer-section */
.viewer-section {
  position: relative;
  width: 100%;
  height: 100%;

  :deep(.scene-wrapper) {
    height: 100% !important;
  }
}


/* Right: scroll + fade like AppLayoutColumns. Pushed to the right half. */
.v-slug__right {
  margin-left: 50vw;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  // Same horizontal padding as header/footer (.app-with-padding--left-right = 1rem each side)
  padding: 6rem var(--app-grid-gap);
  scrollbar-width: thin;
  scrollbar-color: var(--app-color-primary) transparent;

  // Mobile: full-width below the 3D viewer, no inner scroll (use body scroll instead).
  // Larger bottom margin so the content clears the footer (matches AppLayoutColumns).
  @media (max-width: 768px) {
    margin-left: 0;
    height: auto;
    overflow-y: visible;
    padding: 2rem var(--app-grid-gap) 6rem;
  }

  // Desktop: content images are narrower than the column, centred.
  @media (min-width: 769px) {
    :deep(.block-image) {
      max-width: 65%;
      margin-left: auto;
      margin-right: auto;
    }
  }

  $fade: 4rem;
  -webkit-mask-image: linear-gradient(to bottom,
                       transparent 0,
                       black $fade,
                       black calc(100% - #{$fade}),
                       transparent 100%);
          mask-image: linear-gradient(to bottom,
                       transparent 0,
                       black $fade,
                       black calc(100% - #{$fade}),
                       transparent 100%);

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: var(--app-color-primary);
    border-radius: 4px;
  }
}

.v-slug__title {
  margin-bottom: 0.5rem;
}

.v-slug__baseline {
  margin-bottom: 2rem;
  opacity: 0.6;
}

.v-slug__meta {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

/* Same style as BlockBulletPoint titles: h3 (sticker, sm) with no extra margin */
.v-slug__meta__title {
  margin: 0;
  min-height: 2.5rem;
}

/* Strip the default ul/li indent that ships in the CMS-authored HTML.
   Force Happy Times NG so li/ul match the paragraph typography. */
.v-slug__meta__value {
  font-family: 'Happy Times NG', Georgia, serif;
  font-size: 1.2rem;
  line-height: 120%;

  :deep(ul) {
    list-style: none;
    padding-left: 0;
    margin: 0;
  }
  :deep(p) {
    margin: 0;
  }
}

.v-slug__nav {
  margin-top: 4rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
