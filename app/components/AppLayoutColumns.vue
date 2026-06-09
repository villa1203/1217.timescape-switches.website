<template>
  <section class="v-app-layout-columns app-with-padding--left-right">
    <!-- Single scroll container (one scrollbar). On desktop it scrolls a tall
         "track"; the grid inside is sticky so it stays in view while we
         translate each column's content in sequence (left first, then right).
         On mobile this is just a normal-flow stacked layout. -->
    <div ref="scrollerRef" class="v-app-layout-columns__scroller" @scroll="onScroll">
      <div class="v-app-layout-columns__track" :style="trackStyle">
        <div class="app-grid v-app-layout-columns__grid">
          <div class="app-grid__col-6 v-app-layout-columns__col v-app-layout-columns__col--first">
            <div ref="leftInnerRef" class="v-app-layout-columns__inner">
              <slot name="first" />
            </div>
          </div>
          <div class="app-grid__col-6 v-app-layout-columns__col">
            <div ref="rightInnerRef" class="v-app-layout-columns__inner">
              <slot name="second" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useIsMobile } from '~/composables/useIsMobile'

defineProps<{
  message?: string
}>()

const scrollerRef   = ref<HTMLElement | null>(null)
const leftInnerRef  = ref<HTMLElement | null>(null)
const rightInnerRef = ref<HTMLElement | null>(null)

const { isMobile } = useIsMobile()
// Sequenced single-scroll behaviour is desktop-only.
const sequenced = computed(() => !isMobile.value)

// Viewport height of the columns and how much each column overflows it.
const colH       = ref(0)
const leftExtra  = ref(0)
const rightExtra = ref(0)

// The track is tall enough to scroll through both columns one after the other:
// colH (one screenful pinned) + the left overflow + the right overflow.
const trackStyle = computed(() =>
  sequenced.value
    ? { height: `${colH.value + leftExtra.value + rightExtra.value}px` }
    : {},
)

let ro: ResizeObserver | null = null
let rafId = 0

function measure() {
  const scroller = scrollerRef.value
  const left  = leftInnerRef.value
  const right = rightInnerRef.value
  if (!scroller || !left || !right) return

  if (!sequenced.value) {
    // Mobile: clear everything so the layout flows naturally.
    colH.value = leftExtra.value = rightExtra.value = 0
    left.style.transform = ''
    right.style.transform = ''
    return
  }

  colH.value       = scroller.clientHeight
  leftExtra.value  = Math.max(0, left.scrollHeight - colH.value)
  rightExtra.value = Math.max(0, right.scrollHeight - colH.value)
  applyTransforms()
}

function applyTransforms() {
  const scroller = scrollerRef.value
  const left  = leftInnerRef.value
  const right = rightInnerRef.value
  if (!scroller || !left || !right || !sequenced.value) return

  const s = scroller.scrollTop

  // Phase 1: scroll the left column. Phase 2 (once left is exhausted): right.
  const leftShift  = Math.min(s, leftExtra.value)
  const rightShift = Math.min(Math.max(s - leftExtra.value, 0), rightExtra.value)

  left.style.transform  = `translateY(${-leftShift}px)`
  right.style.transform = `translateY(${-rightShift}px)`
}

function onScroll() {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    rafId = 0
    applyTransforms()
  })
}

onMounted(() => {
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => measure())
    if (leftInnerRef.value)  ro.observe(leftInnerRef.value)
    if (rightInnerRef.value) ro.observe(rightInnerRef.value)
    if (scrollerRef.value)   ro.observe(scrollerRef.value)
  }
  measure()
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
  if (rafId) cancelAnimationFrame(rafId)
})

// Re-measure (and reset) when crossing the desktop/mobile breakpoint.
watch(sequenced, () => {
  if (scrollerRef.value) scrollerRef.value.scrollTop = 0
  nextTick(measure)
})
</script>


<style lang="scss" scoped >
.v-app-layout-columns {
  height: calc(100vh - var(--app-header-height, 0px) - var(--app-footer-height, 0px));
  box-sizing: border-box;

  // Mobile: drop the viewport-height constraint so stacked columns flow
  @media (max-width: 768px) {
    height: auto;
  }
}

// The one scroll container.
.v-app-layout-columns__scroller {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--app-color-primary) transparent;

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb {
    background: var(--app-color-primary);
    border-radius: 4px;
  }

  // Mobile: no inner scroll — let the page (body) scroll the stacked columns.
  @media (max-width: 768px) {
    height: auto;
    overflow: visible;
  }
}

// Tall on desktop (height set inline) to create the scroll range; auto on mobile.
.v-app-layout-columns__track {
  position: relative;

  @media (max-width: 768px) {
    height: auto !important;
  }
}

.v-app-layout-columns__grid {
  // Pinned at the top of the scroller while the track scrolls underneath.
  position: sticky;
  top: 0;
  height: calc(100vh - var(--app-header-height, 0px) - var(--app-footer-height, 0px));
  // Wider gutter between the two main columns than the default grid gap.
  gap: 4rem;

  // Mobile: stack the columns vertically, no pinning.
  @media (max-width: 768px) {
    position: static;
    flex-direction: column;
    flex-wrap: wrap;
    height: auto;
    gap: var(--app-grid-gap);
  }
}

.v-app-layout-columns__col {
  height: 100%;
  box-sizing: border-box;
  // Each column is a fixed window; its inner content is translated by JS, so
  // the overflow is clipped here (no per-column scrollbar any more).
  overflow: hidden;

  // Fade content into the page background at top and bottom of the visible window.
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

  // Mobile: full width, natural height, no clipping/mask.
  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    height: auto;
    overflow: visible;
    -webkit-mask-image: none;
            mask-image: none;
  }
}

// The translated content block inside each column window.
.v-app-layout-columns__inner {
  padding-top: 6rem;
  padding-bottom: 6rem;
  will-change: transform;

  @media (max-width: 768px) {
    padding-top: 2rem;
    padding-bottom: 2rem;
    transform: none !important;
  }
}

// Mobile: the columns stack, so the last one sits at the very bottom of the
// page. Give it more breathing room before the footer.
@media (max-width: 768px) {
  .v-app-layout-columns__col:last-child .v-app-layout-columns__inner {
    padding-bottom: 6rem;
  }
}
</style>
