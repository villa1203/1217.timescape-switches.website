<template>
  <Teleport to="body">
    <!--
      Close button is a sibling of .research-overlay (not a child) so its
      z-index isn't trapped in the overlay's stacking context. That lets it
      sit above the app header (z-index: 500 on desktop) which itself stays
      visible above the overlay (z-index: 400) while research is open.
    -->
    <OverlayCloseButton
      :open="isOpen"
      :style="{ '--reveal-delay': isHome ? 'var(--overlay-open-delay)' : '0s' }"
      @close="close"
    />

    <div class="research-overlay" :class="{ 'is-open': isOpen, 'is-home': isHome }">

      <!-- Body: left preview + right list -->
      <div class="overlay-body">

        <!-- Left half: 3D model — each component mounts once on first hover and stays alive -->
        <div class="overlay-preview">
          <template v-for="obj in objects" :key="obj.id">
            <div
              v-if="mountedIds[obj.id] && modelUrlBySlug[obj.slug]"
              :class="['preview-mount', { 'is-active': activeObject?.id === obj.id }]"
            >
              <component :is="obj.component" mode="glass" :paused="activeObject?.id !== obj.id" :src="modelUrlBySlug[obj.slug]" />
            </div>
          </template>

          <!-- Design & Time: an image preview in the same spot as the 3D models. -->
          <div :class="['preview-mount', { 'is-active': designTimeHover }]">
            <img src="/Frame1000003925.svg" alt="" class="preview-image" />
          </div>
        </div>

        <!-- Right half: hierarchy + list -->
        <div class="overlay-list">
          <div class="list-content">

            <span class="list-label">Origin</span>

            <NuxtLink
              to="/research"
              @click="close"
              class="origin-link overlay-nav-link"
              @mouseenter="designTimeHover = true"
              @mouseleave="designTimeHover = false"
            >
              <StickerParagraph text="Design & Time" :font_size="32" :inverted="designTimeHover" />
            </NuxtLink>

            <NuxtLink
              to="/shabbat-as-a-time-ritual"
              @click="close"
              class="origin-link origin-link--last overlay-nav-link"
              @mouseenter="shabbatHover = true"
              @mouseleave="shabbatHover = false"
            >
              <StickerParagraph text="Shabbat as a time ritual" :font_size="32" :inverted="shabbatHover" />
            </NuxtLink>

            <span class="list-label">Objects</span>

            <ul class="objects-list" @mouseleave="activeObject = null">
              <li
                v-for="obj in objects"
                :key="obj.id"
                class="objects-list__item"
                @mouseenter="onObjectEnter(obj)"
              >
                <NuxtLink :to="`/objects/${obj.slug}`" @click="close" class="overlay-nav-link">
                  <StickerParagraph
                    :text="obj.label"
                    :font_size="38"
                    :line_height="1.0"
                    :inverted="activeObject?.id === obj.id"
                  />
                </NuxtLink>
              </li>
            </ul>

          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, defineAsyncComponent } from 'vue'
import { useResearchOverlay } from '~/composables/useResearchOverlay'

const { isOpen, close } = useResearchOverlay()

// Fetch each object's CMS 3D model URL so the hover preview loads the same .glb
// as the detail page. (The bundled /public/*.glb fallbacks were removed once
// the models moved into the CMS, so the preview must get its URL from there.)
const { data: modelsData } = useFetch<{ result: { slug: string; model: { url: string } | null }[] }>(
  '/api/CMS_KQLRequest',
  {
    lazy: true,
    method: 'POST',
    body: {
      query: "page('objects').children.listed",
      select: {
        slug: true,
        model: { query: 'page.model_file.toFile', select: { url: true } },
      },
    },
  },
)

const modelUrlBySlug = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  for (const o of modelsData.value?.result ?? []) {
    if (o.model?.url) map[o.slug] = o.model.url
  }
  return map
})

const ThreeKettle    = defineAsyncComponent(() => import('./ThreeKettle.vue'))
const ThreeSwitch    = defineAsyncComponent(() => import('./ThreeSwitch.vue'))
const ThreeFridge    = defineAsyncComponent(() => import('./ThreeFridge.vue'))
const ThreeElevator  = defineAsyncComponent(() => import('./ThreeElevator.vue'))
const ThreePlugtimer = defineAsyncComponent(() => import('./ThreePlugtimer.vue'))
const ThreeLamp      = defineAsyncComponent(() => import('./ThreeLamp.vue'))

const objects = [
  { id: 'kettle',    label: 'Kettle',                slug: 'shabbat-kettle',          component: ThreeKettle },
  { id: 'switch',    label: 'Kosher Switch',         slug: 'kosher-switch',           component: ThreeSwitch },
  { id: 'fridge',    label: 'Shabbat Refrigerator',  slug: 'shabbat-mode-refrigerator', component: ThreeFridge },
  { id: 'elevator',  label: 'Elevator',              slug: 'elevator',                component: ThreeElevator },
  { id: 'plugtimer', label: 'Plug Timer',            slug: 'plug-in-timer',           component: ThreePlugtimer },
  { id: 'lamp',      label: 'Kosher Lamp',           slug: 'kosher-lamp',             component: ThreeLamp },
]

const activeObject      = ref<typeof objects[0] | null>(null)
const mountedIds        = ref<Record<string, boolean>>({})
const designTimeHover   = ref(false)
const shabbatHover      = ref(false)

function onObjectEnter(obj: typeof objects[0]) {
  mountedIds.value[obj.id] = true
  activeObject.value = obj
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

// Close the overlay on any navigation (clicking Info, the shabbat → home link,
// Design & Time, an object name, etc. — anything that changes the route).
const route = useRoute()
// On the home the dotted circles play an erase animation when Research opens, so
// the panel waits for it before fading in (see the .is-home delay in styles).
const isHome = computed(() => route.path === '/')
watch(() => route.fullPath, () => {
  if (isOpen.value) close()
})

watch(isOpen, (val) => {
  if (val) {
    document.addEventListener('keydown', onKeydown)
    document.body.style.overflow = 'hidden'
    import('./ThreeKettle.vue')
    import('./ThreeSwitch.vue')
    import('./ThreeFridge.vue')
    import('./ThreeElevator.vue')
    import('./ThreePlugtimer.vue')
    import('./ThreeLamp.vue')
  } else {
    document.removeEventListener('keydown', onKeydown)
    document.body.style.overflow = ''
    activeObject.value = null
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<style lang="scss" scoped>
/* ── overlay shell ── */
.research-overlay {
  // How long to wait before the panel covers the home — long enough for the
  // dotted circles' erase animation to play (DottedCircles: 1.5s + 0.6s stagger).
  --overlay-open-delay: 1.9s;

  position: fixed;
  inset: 0;
  z-index: 400;
  background: #ffffff;
  opacity: 0;
  visibility: hidden; // cascades to descendants — they aren't click/scroll targets when closed
  pointer-events: none;
  // delay visibility change until after the fade-out completes
  transition: opacity 0.3s ease, visibility 0s linear 0.3s;

  // Opening: by default (non-home, no circles) the panel fades in immediately.
  // Closing (the default block above) also has no delay — it reveals the
  // circles redrawing underneath.
  &.is-open {
    opacity: 1;
    visibility: visible;
    pointer-events: all;
    transition: opacity 0.3s ease, visibility 0s linear 0s;
  }

  // Home only: hold the panel back while the circles erase, then fade it in.
  &.is-home.is-open {
    transition:
      opacity 0.3s ease var(--overlay-open-delay),
      visibility 0s linear var(--overlay-open-delay);
  }
}

/* ── corners — mirror the nav padding exactly ── */
.overlay-corner {
  position: absolute;
  z-index: 2;
  padding: var(--app-grid-gap);

  &--tl { top: 0; left: 0; }
  &--tr {
    top: 0;
    right: 0;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  &--bl {
    bottom: 0;
    left: 0;
    padding-left: 0;
    padding-right: 0;
  }
}

.overlay-nav-link {
  text-decoration: none;
}

/* ── close button: extracted to <OverlayCloseButton> ── */

/* ── split body ── */
.overlay-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;

  // Mobile: full-page, right column layered on top of left column (3D preview behind)
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    height: 100vh;
    min-height: 100vh;
    position: relative;

    .overlay-preview {
      grid-column: 1;
      grid-row: 1;
      z-index: 1;
    }

    .overlay-list {
      grid-column: 1;
      grid-row: 1;
      z-index: 2;
      background: transparent;
      overflow-y: auto;
      padding-top: 4rem;
      align-items: flex-start;
    }
  }
}

/* ── left: 3D preview ── */
.overlay-preview {
  position: relative;
  overflow: hidden;
}

.preview-mount {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;

  &.is-active {
    opacity: 1;
    pointer-events: auto;
  }

  :deep(.scene-wrapper) {
    height: 100% !important;
  }
}

/* Design & Time image preview — centred and contained like the 3D models. */
.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 2rem;
  box-sizing: border-box;
}

/* ── right: list ── */
.overlay-list {
  display: flex;
  align-items: center;
  justify-content: center;
  // Push the centered list block down a bit — reduces the available space
  // at the top of the flex container.
  padding-top: 6rem;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 0;

  // Sticker texts in this panel ("Design & Time", object names) follow the h1 typo
  // (Happy Times NG, regular weight) instead of StickerParagraph's default (Sligoil, 800).
  :deep(.sp-t) {
    font-family: 'Happy Times NG', Georgia, serif;
    font-weight: 400;
  }
}

.list-label {
  font-family: 'Sligoil', sans-serif;
  font-size: 1rem;
  letter-spacing: 0.06em;
  font-weight: 800;
  text-transform: uppercase;
  color: #820FC1;
  opacity: 1;
  padding-left: 0.0.5rem;
  padding-bottom: 0.5rem;
  line-height: 1.6;
}

// "Origin" links (Design & Time, Shabbat as a time ritual) sit tight together…
.origin-link {
  margin-bottom: 0.5rem;
}

// …with a larger gap after the last one before the "Objects" section.
.origin-link--last {
  margin-bottom: 3rem;
}

.objects-list {
  list-style: none;
  padding: 0 0 48px; // bottom pad so last item's SVG overflow isn't clipped
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.objects-list__item {
  cursor: default;
  position: relative;
  // Fixed hit zone height = desired visual pitch (116px SVG − 48px visual collapse).
  // SVG overflows visually into the next item's space, creating the stacked look,
  // but the DOM boxes are non-overlapping so mouseenter/leave are unambiguous.
  height: 68px;
  overflow: visible;
  transition: transform 0.15s ease;

  // Later items cover earlier items' overflowing SVGs — needed for multi-line labels
  // (e.g. "Shabbat Refrigerator") whose SVG would otherwise sit on top of the next item.
  &:nth-child(1) { z-index: 1; }
  &:nth-child(2) { z-index: 2; }
  &:nth-child(3) { z-index: 3; }
  &:nth-child(4) { z-index: 4; }
  &:nth-child(5) { z-index: 5; }
  &:nth-child(6) { z-index: 6; }

  // SVG overflow must not intercept events destined for the item below.
  :deep(svg) { pointer-events: none; }

  // Last item has no neighbour to "cover" its SVG overflow → extend hit-zone
  // to the full SVG height so hovering the bottom half of the label still fires.
  &:last-child {
    height: 116px;
  }

  &:hover {
    transform: translateX(-6px);
  }

  // Mobile: disable the SVG-overflow stacking trick so labels don't bleed onto each other.
  // Multi-line labels ("Shabbat Refrigerator") otherwise overlap the next item visually.
  @media (max-width: 768px) {
    height: auto;
    margin-bottom: 0.5rem;

    &:last-child {
      height: auto;
    }
  }
}

</style>
