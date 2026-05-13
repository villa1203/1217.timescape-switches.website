<template>
  <main class="v-slug">
    <div class="v-slug__layout">

      <!-- Left: 3D viewer — hover reveals the transparent xray (mode='normal') -->
      <div class="v-slug__left">
        <div class="viewer-section">
          <component
            v-if="threeComponent"
            :is="threeComponent"
            :mode="transparentOn ? 'glass' : 'normal'"
          />
        </div>
      </div>

      <!-- Right: text content with independent scroll + edge fade -->
      <div class="v-slug__right">
        <h1 class="v-slug__title">{{ data?.result.title }}</h1>
        <p v-if="data?.result.baseline" class="v-slug__baseline">{{ data.result.baseline }}</p>

        <div class="v-slug__meta">
          <div>
            <dt>Strategies</dt>
            <dd>{{ data?.result.strategies }}</dd>
          </div>
          <div>
            <dt>Production</dt>
            <dd>{{ data?.result.production }}</dd>
          </div>
          <div>
            <dt>Pre-commitment</dt>
            <dd>{{ data?.result.pre_commitment }}</dd>
          </div>
          <div>
            <dt>Delegated agency</dt>
            <dd>{{ data?.result.delegated_agency }}</dd>
          </div>
          <div>
            <dt>Action & effect</dt>
            <dd>{{ data?.result.action_and_effect }}</dd>
          </div>
        </div>

        <div v-if="data?.result.content">
          <Blocks :content="data.result.content"/>
        </div>

        <nav class="v-slug__nav">
          <StickerButton
            :text="`← ${prevObject.label}`"
            :to="`/objects/${prevObject.slug}`"
            :font_size="20"
          />
          <StickerButton
            :text="`${nextObject.label} →`"
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
import {KQL_PROJECTS_SELECT} from "#shared/KQLQueries";
import type {CMS_API_ImageInstance, CMS_API_Response, CMS_BlockData} from "#shared/cms_api";

type FetchData = CMS_API_Response & {
  "result": {
    title: string,
    slug: string,
    content: CMS_BlockData[],
    strategies: string
    production: string
    pre_commitment: string
    delegated_agency: string
    action_and_effect: string
    baseline: string
    cover_front: CMS_API_ImageInstance[]
    cover_back: CMS_API_ImageInstance[]
  }
}

const route = useRoute()

const {data} = await useFetch<FetchData>('/api/CMS_KQLRequest', {
  lazy: true,
  method: 'POST',
  body: {
    query: `page('objects/${route.params.slug}')`,
    select: KQL_PROJECTS_SELECT,
  }
})

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
  padding: 6rem 0;
  scrollbar-width: thin;
  scrollbar-color: var(--app-color-primary) transparent;

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
