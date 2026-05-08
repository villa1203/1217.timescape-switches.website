<template>
    <footer class="v-app-footer app-with-padding--top-bottom"
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
  margin-top: 10rem;
  width: 100%;
}
</style>
