<template>
    <footer class="v-app-footer app-with-padding--top-bottom app-with-padding--left-right"
            :class="{ 'v-app-footer--locked': isShabbat, 'v-app-footer--scroll-hidden': footerHidden }"
    >
      <div class="v-app-footer__container">
        <StickerParagraph
          :text="`Design Research On Ritual\nConstraints And Domestic Technology`"
          :font_size="footerFontSize"
          :max_width="FOOTER_TEXT_MAX_WIDTH"
          :inverted="isShabbat"
        />
        <div class="v-app-footer__dark-toggle">
          <DarkModeToggle
            :model-value="previewDark"
            :inline="true"
            @update:model-value="toggleDark"
          />
        </div>
      </div>
    </footer>
</template>





<script setup lang="ts">
import { useIsMobile } from '~/composables/useIsMobile'
import { useShabbatCountdown } from '~/composables/useShabbatCountdown'

/* ── layout constants — edit here ──────────────────────────────────── */
const FOOTER_TEXT_MAX_WIDTH = 630  // px — column width for "Design Research On Ritual..."

const { isMobile } = useIsMobile()
const footerFontSize = computed(() => isMobile.value ? 18 : 24)
const { isShabbat } = useShabbatCountdown()
const previewDark = useState('previewDark', () => false)
function toggleDark() {
  if (!isShabbat.value) previewDark.value = !previewDark.value
}

// Same scroll signals as the nav's Research/Info buttons (driven by the listener
// in AppNav): hide on scroll down AND while at the very top of the page, but
// always show at the very bottom — and always show on the home page. Mobile only.
const hiddenOnScroll = useState('uiScrollHidden', () => false)
const atTop = useState('uiAtTop', () => true)
const atBottom = useState('uiAtBottom', () => false)
const route = useRoute()
const isHome = computed(() => route.path === '/')
const footerHidden = computed(() =>
  !isHome.value && !atBottom.value && (hiddenOnScroll.value || atTop.value),
)
</script>





<style lang="scss" scoped >
.v-app-footer {
  width: 100%;
  // Sticker text inherits font-weight from its container — bold for footer
  font-weight: 700;
  // Same overflow protection as the nav — sticker SVGs never push outside the screen
  overflow-x: hidden;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.v-app-footer__container {
  position: relative;
}

// Shabbat: dim the footer like the navigation.
.v-app-footer--locked {
  opacity: 0.35;
}

.v-app-footer__dark-toggle {
  position: absolute;
  right: 0;
  bottom: 0;
  // The global footer rule forces pointer-events:none on every descendant
  // (specificity 0,2,0). !important is the only reliable override here.
  pointer-events: auto !important;

  :deep(*) {
    pointer-events: auto !important;
  }
}

// Hidden while scrolling down, slides back in on scroll up — mobile only.
// Mirrors the nav's .nav-right--scroll-hidden behaviour (slides downward here).
.v-app-footer--scroll-hidden {
  @media (max-width: 768px) {
    opacity: 0;
    pointer-events: none;
    transform: translateY(0.5rem);
  }
}
</style>
