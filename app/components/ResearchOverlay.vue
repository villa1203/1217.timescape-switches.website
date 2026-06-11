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

          <!-- Design & Time: the home's 5 dotted circles (no P5 sketch). -->
          <div :class="['preview-mount', { 'is-active': designTimeHover }]">
            <div class="preview-circles">
              <DottedCircles :sketch="false" :color="'#FF6600'" :stroke_width="3" />
            </div>
          </div>

          <!-- Sacred Time Structure: the home's rotating wireframe globe, smaller.
               Mounts on first hover (and unmounts when the panel closes) so its
               animation loop doesn't run while it's not needed. -->
          <div v-if="shabbatMounted" :class="['preview-mount', { 'is-active': shabbatHover }]">
            <div class="preview-globe">
              <WireframeGlobe />
            </div>
          </div>
        </div>

        <!-- Right half: hierarchy + list -->
        <div class="overlay-list" ref="listRef">
          <div class="list-content">

            <span class="list-label list-label--origin">Origin</span>

            <NuxtLink
              to="/sacred-time-structured"
              @click="close"
              class="origin-link overlay-nav-link"
              @mouseenter="shabbatHover = true; shabbatMounted = true"
              @mouseleave="shabbatHover = false"
            >
              <StickerParagraph text="Sacred Time Structure" :font_size="38" color="var(--app-color-secondary)" :inverted="shabbatHover" :blob_scale="0.8" :max_width="stickerMaxWidth" />
            </NuxtLink>

            <NuxtLink
              to="/design-time"
              @click="close"
              class="origin-link origin-link--last overlay-nav-link"
              @mouseenter="designTimeHover = true"
              @mouseleave="designTimeHover = false"
            >
              <StickerParagraph text="Design & Time" :font_size="38" color="var(--app-color-secondary)" :inverted="designTimeHover" :blob_scale="0.8" :max_width="stickerMaxWidth" />
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
                    :blob_scale="0.8"
                    :max_width="stickerMaxWidth"
                  />
                </NuxtLink>
              </li>
            </ul>

            <!-- Studio credit. Desktop: absolutely pinned to the overlay's
                 bottom-right (containing block = .research-overlay, so it escapes
                 the list's overflow). Mobile: flows in here, below the objects. -->
            <div class="overlay-bureau">
              <a
                href="https://bureau1217.ch/"
                target="_blank"
                rel="noopener"
                class="overlay-bureau__link"
                aria-label="Project by Bureau 1217"
              >
                <svg class="overlay-bureau__logo" viewBox="0 0 478.4 69" aria-hidden="true">
                  <filter id="bureau-purple" x="0" y="0" width="100%" height="100%">
                    <feFlood flood-color="#820FC1" result="purple" />
                    <feComposite in="purple" in2="SourceAlpha" operator="in" />
                  </filter>
                  <image href="/B1217_LOGO-BLANC-01.svg" x="0" y="0" width="478.4" height="69" filter="url(#bureau-purple)" />
                </svg>
              </a>
            </div>

          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, defineAsyncComponent } from 'vue'
import { useResearchOverlay } from '~/composables/useResearchOverlay'

const { isOpen, close } = useResearchOverlay()

// Measure the list column's real width so the sticker links wrap to fit it
// (the column is ~50% of the viewport on desktop, so the default 600px / viewport
// wrap width overflowed it and got clipped on the right). Subtract a margin for
// the blob outline that extends past the text.
const listRef = ref<HTMLElement | null>(null)
const listWidth = ref(600)
const stickerMaxWidth = computed(() => Math.max(120, listWidth.value - 32))
let listRO: ResizeObserver | null = null

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
const shabbatMounted    = ref(false)  // globe preview: mount on first hover, drop on close

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
    // Drop the globe so its animation loop stops while the panel is closed.
    shabbatHover.value = false
    shabbatMounted.value = false
  }
})

onMounted(() => {
  if (listRef.value && typeof ResizeObserver !== 'undefined') {
    listRO = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w && w > 0) listWidth.value = w
    })
    listRO.observe(listRef.value)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
  listRO?.disconnect()
  listRO = null
})
</script>

<style lang="scss" scoped>
/* ── overlay shell ── */
.research-overlay {
  // How long to wait before the panel covers the home. The dotted circles keep
  // erasing underneath (DottedCircles: 1.5s + 0.6s stagger), but the panel now
  // fades in earlier so the overlay feels snappier to open.
  --overlay-open-delay: 0.8s;

  position: fixed;
  inset: 0;
  z-index: 400;
  background: #ffffff;
  opacity: 0;
  visibility: hidden; // cascades to descendants — they aren't click/scroll targets when closed
  pointer-events: none;
  // delay visibility change until after the fade-out completes
  transition: opacity 0.5s ease-in-out, visibility 0s linear 0.5s;

  // Opening: by default (non-home, no circles) the panel fades in immediately.
  // Closing (the default block above) also has no delay — it reveals the
  // circles redrawing underneath.
  &.is-open {
    opacity: 1;
    visibility: visible;
    pointer-events: all;
    transition: opacity 0.5s ease-in-out, visibility 0s linear 0s;
  }

  // Home only: hold the panel back while the circles erase, then fade it in.
  &.is-home.is-open {
    transition:
      opacity 0.5s ease-in-out var(--overlay-open-delay),
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

/* Studio credit pinned to the overlay's bottom-right, aligned with the nav gutter. */
.overlay-bureau {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 2;
  padding: var(--app-grid-gap, 1rem);

  @media (max-width: 768px) {
    // Mobile: flow in below the objects list (no longer pinned/overlapping).
    position: static;
    margin-top: 0.5rem;
    padding-left: 0;
    padding-right: 0;
    padding-top: 0;
    // Extra breathing room below the logo, plus clearance for the iOS/Android
    // browser chrome at the very bottom.
    padding-bottom: calc(6rem + env(safe-area-inset-bottom, 0px));
  }
}

.overlay-bureau__link {
  display: inline-block;
  // Same little hover pop as the close button / stickers.
  transition: transform 0.2s ease;

  &:hover { transform: scale(1.05); }
}

.overlay-bureau__logo {
  display: block;
  // Small studio credit.
  height: 1.5rem;
  width: auto;
  overflow: visible;

  @media (max-width: 768px) {
    height: 1.2rem;
  }
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

/* Design & Time: the home's 5 dotted circles, centred in the column. */
.preview-circles {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  box-sizing: border-box;

  :deep(.dotted-circles) {
    width: 110%;
    height: auto;
    // Over the white panel keep the real purple (the component defaults to
    // mix-blend-mode: difference, tuned for the home's animated background).
    mix-blend-mode: normal;
  }
}

/* Shabbat preview: the home's wireframe globe, scaled down and centred.
   Recoloured orange with a thicker stroke — overriding the component's
   hard-coded black/purple groups via CSS (which wins over SVG presentation
   attributes), so the home globe is untouched. */
.preview-globe {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;

  :deep(.wireframe-globe) {
    width: 78%;
    height: auto;
    aspect-ratio: 16 / 9;
    background: transparent;   // sit over the panel, no white box
    // The globe's arcs reach past its own viewBox; show them instead of
    // clipping the strokes at the edges.
    overflow: visible;
    // The globe's horizontal radius (~900) is ~1.8× its vertical radius (~495)
    // — it's built oblate to fill the wide home viewport. Squish x back so both
    // radii match and it reads as a round sphere.
    transform: scaleX(0.55);
  }

  :deep(.wireframe-globe g) {
    stroke: var(--app-color-secondary);
    stroke-width: 5;
  }
}

/* ── right: list ── */
.overlay-list {
  display: flex;
  // `safe center`: vertically centred when it fits, but falls back to top
  // alignment (instead of clipping the top) once the content is taller than the
  // column — so the overflow below stays reachable by scrolling.
  align-items: safe center;
  justify-content: center;
  // Scroll the list vertically when the viewport is too short for the full menu.
  // Lock the horizontal axis: the sticker SVG blobs overflow left/right of the
  // text and would otherwise trigger an unwanted horizontal scrollbar (most
  // visible on mobile). The horizontal padding below gives the blobs room so
  // clipping them with `hidden` doesn't cut the visible outline.
  overflow-y: auto;
  overflow-x: hidden;
  // Purple scrollbar — same params as the other pages (AppLayoutColumns / object page).
  scrollbar-width: thin;
  scrollbar-color: var(--app-color-primary) transparent;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: var(--app-color-primary);
    border-radius: 4px;
  }
  // Push the centered list block down a bit — reduces the available space
  // at the top of the flex container.
  padding-top: 6rem;
  // Breathing room so the last item isn't flush against the bottom when scrolled.
  padding-bottom: 2rem;
  // Side margins so the sticker outlines aren't clipped at the column edges.
  padding-left: 2.5rem;
  padding-right: 2.5rem;
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

// "Origin" section label + its links (Design & Time, Sacred Time Structure)
// use the orange secondary colour instead of the default purple.
.list-label--origin {
  color: var(--app-color-secondary);
}

// "Origin" links (Design & Time, Sacred Time Structure) use the same vertical
// pitch as the objects list (.objects-list__item height) so the line spacing
// between them matches the objects' line spacing across the panel.
.origin-link {
  display: block;
  // min-height (not fixed height) = the single-line pitch, but the box grows
  // when the label wraps to 2 lines instead of overlapping the next link.
  min-height: 68px;
  // Same hover interaction as the objects below: shift left on hover.
  transition: transform 0.15s ease;

  // Mobile: match the objects list's mobile line spacing (.objects-list__item)
  // so the gap between "Sacred Time Structure" and "Design & Time" lines up.
  @media (max-width: 768px) {
    min-height: 0;
    margin-bottom: 0.5rem;
  }
}

.origin-link:hover {
  transform: translateX(-6px);
}

// …with a larger gap after the last one before the "Objects" section.
.origin-link--last {
  height: auto;
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
  // min-height = the single-line pitch (SVG overflows into the next item's space
  // for the stacked look); the box grows when a label wraps to 2 lines so it no
  // longer overlaps the next item.
  min-height: 68px;
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
    min-height: 116px;
  }

  &:hover {
    transform: translateX(-6px);
  }

  // Mobile: disable the SVG-overflow stacking trick so labels don't bleed onto each other.
  // Multi-line labels ("Shabbat Refrigerator") otherwise overlap the next item visually.
  @media (max-width: 768px) {
    min-height: 0;
    margin-bottom: 0.5rem;

    &:last-child {
      min-height: 0;
    }
  }
}

</style>
