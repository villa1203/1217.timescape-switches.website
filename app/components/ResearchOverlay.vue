<template>
  <Teleport to="body">
    <div class="research-overlay" :class="{ 'is-open': isOpen }">

      <!-- Body: left preview + right list (the real header / footer stay
           visible above this overlay via a higher z-index) -->
      <div class="overlay-body">

        <!-- Left half: 3D model — each component mounts once on first hover and stays alive -->
        <div class="overlay-preview">
          <template v-for="obj in objects" :key="obj.id">
            <div
              v-if="mountedIds[obj.id]"
              :class="['preview-mount', { 'is-active': activeObject?.id === obj.id }]"
            >
              <component :is="obj.component" mode="plain" :paused="activeObject?.id !== obj.id" />
            </div>
          </template>
        </div>

        <!-- Right half: hierarchy + list -->
        <div class="overlay-list">
          <div class="list-content">

            <span class="list-label">Origin</span>

            <NuxtLink
              to="/research"
              @click="close"
              class="design-time overlay-nav-link"
              @mouseenter="designTimeHover = true"
              @mouseleave="designTimeHover = false"
            >
              <StickerParagraph text="Design & Time" :font_size="32" :inverted="designTimeHover" />
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
import { ref, watch, onUnmounted, defineAsyncComponent } from 'vue'
import { useResearchOverlay } from '~/composables/useResearchOverlay'

const { isOpen, close } = useResearchOverlay()

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

const activeObject    = ref<typeof objects[0] | null>(null)
const mountedIds      = ref<Record<string, boolean>>({})
const designTimeHover = ref(false)

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
  position: fixed;
  inset: 0;
  z-index: 200;
  background: #ffffff;
  opacity: 0;
  visibility: hidden; // cascades to descendants — they aren't click/scroll targets when closed
  pointer-events: none;
  // delay visibility change until after the fade-out completes
  transition: opacity 0.3s ease, visibility 0s linear 0.3s;

  &.is-open {
    opacity: 1;
    visibility: visible;
    pointer-events: all;
    transition: opacity 0.3s ease, visibility 0s linear 0s;
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

/* ── split body ── */
.overlay-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  height: 100vh;

  // Mobile: stack — 3D preview on top, list below; allow page scroll inside the overlay
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: 50vh auto;
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
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

.design-time {
  // Gap between the "Origin / Design & Time" block and the "Objects" section below
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
}

</style>
