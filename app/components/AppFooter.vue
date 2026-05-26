<template>
    <footer class="v-app-footer app-with-padding--top-bottom app-with-padding--left-right"
            :class="{ 'v-app-footer--locked': isDark }"
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
</script>





<style lang="scss" scoped >
.v-app-footer {
  width: 100%;
  // Sticker text inherits font-weight from its container — bold for footer
  font-weight: 700;
  // Same overflow protection as the nav — sticker SVGs never push outside the screen
  overflow-x: hidden;
  transition: opacity 0.3s ease;
}

// Shabbat: dim the footer like the navigation.
.v-app-footer--locked {
  opacity: 0.35;
}
</style>
