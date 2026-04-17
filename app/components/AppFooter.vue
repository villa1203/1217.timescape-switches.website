<template>
    <footer class="v-app-footer app-with-padding--top-bottom"
    >
      <div class="v-app-footer__container app-grid app-grid--justify-between app-grid--direction-column">
        <StickerText
          :text="`Design Research On Ritual\nConstraints And Domestic Technology`"
          :font_size="24"
          :stroke_width="20"
        />
      </div>

    </footer>
</template>





<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
    message?: string
}>()
</script>





<style lang="scss" scoped >
.v-app-footer {
  margin-top: 10rem;
  width: 100%;
}
</style>
