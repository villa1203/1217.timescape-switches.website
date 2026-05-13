<template>
    <footer class="v-app-footer app-with-padding--top-bottom app-with-padding--left-right"
    >
      <div class="v-app-footer__container app-grid app-grid--justify-between app-grid--direction-column">
        <StickerParagraph
          :text="`Design Research On Ritual\nConstraints And Domestic Technology`"
          :font_size="24"
          :max_width="FOOTER_TEXT_MAX_WIDTH"
        />
      </div>

    </footer>
</template>





<script setup lang="ts">
/* ── layout constants — edit here ──────────────────────────────────── */
const FOOTER_TEXT_MAX_WIDTH = 630  // px — column width for "Design Research On Ritual..."
</script>





<style lang="scss" scoped >
.v-app-footer {
  width: 100%;
  // Sticker text inherits font-weight from its container — bold for footer
  font-weight: 700;
  // Same overflow protection as the nav — sticker SVGs never push outside the screen
  overflow-x: hidden;
}
</style>
