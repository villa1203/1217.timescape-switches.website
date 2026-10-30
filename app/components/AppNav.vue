<template>
    <nav class="v-nav app-with-padding--left-right app-with-padding--top-bottom"
    >
      <div class="app-grid app-grid--justify-between">
        <div :class="['nav-left', { 'nav-left--locked': isShabbat }]">
          <StickerButton :text="shabbatText" to="/" :font_size="navFontSize" :max_width="isMobile ? 330 : 600" :flip="isShabbat" :blob_scale="1.25" @click="closeResearch" />
        </div>

        <div :class="['nav-right', { 'nav-right--hidden': isOpen, 'nav-right--scroll-hidden': hiddenOnScroll, 'nav-right--locked': isShabbat }]">
          <div class="app-grid nav-right__grid">
            <div style="overflow: hidden !important;">
                <div style="width: 100%; aspect-ratio: 12/1" />
              <StickerButton
                text="Research"
                @click="openResearch"
                :font_size="navFontSize"
                color="var(--app-color-primary)"
                :active="researchActive"
                :flip="isShabbat"
                :blob_scale="1.25"
              />
            </div>

              <div style="overflow: hidden !important;" >
                  <div style="width: 100%; aspect-ratio: 7.25/1" />
              <StickerButton text="Info" @click="openInfo" :font_size="navFontSize" :active="isInfoPage" :flip="isShabbat" :blob_scale="1.25" />
            </div>
          </div>
        </div>


      </div>
    </nav>
</template>





<script setup lang="ts">
import { useShabbatCountdown } from '~/composables/useShabbatCountdown'
import { useResearchOverlay } from '~/composables/useResearchOverlay'
import { useIsMobile } from '~/composables/useIsMobile'
import { useWeeklyTimescape } from '~/composables/useWeeklyTimescape'
const { text: shabbatText, isShabbat } = useShabbatCountdown()
const { toggle: openResearch, close: closeResearch, isOpen } = useResearchOverlay()
const { isMobile } = useIsMobile()
const navFontSize = computed(() => isMobile.value ? 18 : 24)
const route = useRoute()
const researchActive = computed(() => isOpen.value || route.path.startsWith('/design-time'))
const isInfoPage = computed(() => route.path.startsWith('/info'))

// Info: navigate directly. (The circles' swap animation that used to play before
// navigating from the home has been removed.)
function openInfo() {
  navigateTo('/info')
}
const weeklyTimescape = useWeeklyTimescape()

/* ── Hide Research/Info on scroll-down, show on scroll-up ──
   Scrolling happens in different containers depending on page/viewport (the
   columns' inner scroller on desktop, the body on mobile, the object page's
   right column…). A capture-phase scroll listener on window catches scroll
   events from any of them as they propagate down to their target. */
// Shared so the footer can hide/show on scroll with the exact same signal.
const hiddenOnScroll = useState('uiScrollHidden', () => false)
// Shared "near the top of the page" flag — the footer uses it to stay hidden
// while at the top. Defaults to true (pages load scrolled to the top).
const atTop = useState('uiAtTop', () => true)
// Shared "near the bottom of the page" flag — the footer reappears there.
const atBottom = useState('uiAtBottom', () => false)
let lastY = 0
let lastTarget: EventTarget | null = null
let scrollTicking = false

function scrollTopOf(target: EventTarget | null): number {
  if (!target || target === document || target === window) {
    return window.scrollY || document.scrollingElement?.scrollTop || 0
  }
  return (target as HTMLElement).scrollTop ?? 0
}

// Visible viewport height and total scrollable height of the scrolling element,
// so we can tell when it's scrolled to the bottom.
function scrollSizeOf(target: EventTarget | null): { ch: number; sh: number } {
  if (!target || target === document || target === window) {
    const el = document.scrollingElement || document.documentElement
    return { ch: window.innerHeight, sh: el?.scrollHeight ?? 0 }
  }
  const el = target as HTMLElement
  return { ch: el.clientHeight, sh: el.scrollHeight }
}

function onScrollCapture(e: Event) {
  if (scrollTicking) return
  scrollTicking = true
  const target = e.target
  requestAnimationFrame(() => {
    scrollTicking = false
    const y = scrollTopOf(target)
    // Within the top offset → "at top" (footer stays hidden there).
    atTop.value = y <= 80
    // Within the bottom offset → "at bottom" (footer reappears there).
    const { ch, sh } = scrollSizeOf(target)
    atBottom.value = sh - (y + ch) <= 80
    // Reset the baseline when the scrolling element changes (e.g. navigation).
    if (target !== lastTarget) {
      lastTarget = target
      lastY = y
      return
    }
    const dy = y - lastY
    if (Math.abs(dy) < 6) return            // ignore jitter
    if (dy > 0 && y > 80) hiddenOnScroll.value = true   // scrolling down, past a small offset
    else if (dy < 0)      hiddenOnScroll.value = false  // scrolling up
    lastY = y
  })
}

// Fetch Shabbat countdown on mount
onMounted(async () => {
  window.addEventListener('scroll', onScrollCapture, { capture: true, passive: true })

  // Query previews bypass the live geo + Hebcal lookup so nothing overwrites the
  // forced state (child mounts before app.vue's onMounted, so read the query
  // directly):
  //  • ?shabbat → force the real Shabbat look on.
  //  • ?dark    → dark aesthetic preview only; no Shabbat, no API.
  // NB: the real Shabbat lookup ALWAYS runs otherwise — the dark-mode toggle
  // (previewDark) must not disable the live Shabbat lock.
  if ('shabbat' in route.query) { isShabbat.value = true; return }
  if ('dark' in route.query) return

  // Approximate location first (instant), refined in the background — the
  // countdown shows even if geolocation is refused, ignored or behind a VPN.
  await weeklyTimescape.start()
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScrollCapture, { capture: true } as EventListenerOptions)
  weeklyTimescape.stop()
})

</script>





<style lang="scss" scoped >
.v-nav {
  width: 100%;
  position: relative;
  // Prevent SVG stickers from horizontally overflowing the viewport
  overflow-x: hidden;
  // Sticker text inherits font-weight from its container — bold for nav
  font-weight: 700;

  // Mobile: stack the rows — shabbat countdown on top, Research + Info below
  @media (max-width: 768px) {
    :deep(.app-grid--justify-between) {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }
  }
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

// Desktop: when the Research overlay is open, hide the Research + Info buttons
// (the overlay has its own close button in the top-right). Fade matches the
// overlay's own 0.3s opacity transition. On mobile the overlay covers the
// whole nav anyway, so we leave the buttons untouched there.
.nav-right {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.nav-right--hidden {
  @media (min-width: 769px) {
    opacity: 0;
    pointer-events: none;
  }
}

.nav-right__grid {
    transform: translate3d(0, -12px, 0);

    @media (max-width: 768px) {
        transform: translate3d(0, -10px, 0);
    }
}

// Hidden while scrolling down, slides back in on scroll up — mobile only.
// On desktop the Research/Info buttons stay put while scrolling.
.nav-right--scroll-hidden {
  @media (max-width: 768px) {
    opacity: 0;
    pointer-events: none;
    transform: translateY(-0.5rem);
  }
}

// Shabbat: the navigation is dimmed and not interactive (the site stays on the
// home — other pages are inaccessible during Shabbat).
.nav-right--locked {
  opacity: 0.35;
  pointer-events: none;
}

// Shabbat: the left "Weekly Timescape" button is also non-interactive.
.nav-left--locked {
  pointer-events: none;
}

.v-nav__infos {
  position: absolute;
  top: var(--app-gutter);
  left: var(--app-gutter);
  width: 30rem;
  background: hsla(0, 0%, 0%, 0.25);
  border-radius: .75rem;
  color: white;
  padding: 5rem .75rem .75rem;
  z-index: 0;
}

.infos-is-open {
  background: transparent;
  transition: none;
  backdrop-filter: none;

  .toggle-infos {
    transform: rotate(45deg);
  }
}
</style>
