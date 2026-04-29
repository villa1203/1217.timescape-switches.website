<template>
  <div class="v-block block-pages-list app-with-padding--left-right">
    <h2>{{block_data.content.title}}</h2>

    <AppProjectsPreview
      v-if="block_data.content.pages_liste"
      :pages="block_data.content.pages_liste"
    />
  </div>
</template>

<script setup lang="ts">
import type {CMS_BlockPages} from "#shared/cms_api"

defineProps<{
  block_data: CMS_BlockPages,
}>()
</script>

<style scoped lang="scss">
.block-pages-list {
  width: 100%;
  box-sizing: border-box;
}
</style>
