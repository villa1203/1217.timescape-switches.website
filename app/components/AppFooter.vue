<template>
    <footer class="v-app-footer app-with-padding--top-bottom app-with-padding--left-right"
            :class="{ 'v-app-footer--locked': isDark, 'v-app-footer--scroll-hidden': footerHidden }"
    >
      <div class="v-app-footer__container app-grid app-grid--justify-between app-grid--direction-column">
        <StickerParagraph
          :text="`Design Research On Ritual\nConstraints And Domestic Technology`"
          :font_size="footerFontSize"
          :max_width="FOOTER_TEXT_MAX_WIDTH"
          :inverted="isDark"
        />
      </div>

    </footer>
</template>





<script setup lang="ts">
import { useIsMobile } from '~/composables/useIsMobile'
import { useDarkMode } from '~/composables/useDarkMode'

/* ── layout constants — edit here ──────────────────────────────────── */
const FOOTER_TEXT_MAX_WIDTH = 630  // px — column width for "Design Research On Ritual..."

const { isMobile } = useIsMobile()
const footerFontSize = computed(() => isMobile.value ? 18 : 24)
const { isDark } = useDarkMode()

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

// Shabbat: dim the footer like the navigation.
.v-app-footer--locked {
  opacity: 0.35;
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
