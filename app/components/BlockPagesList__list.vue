<template>
  <div class="v-block block-page-list--list app-with-padding--left-right app-rm-child-margin">
    <h2>{{block_data.content.title}}</h2>

    <AppProjectsPreview__list
      v-if="block_data.content.pages_liste"
      :pages="block_data.content.pages_liste"
    />
  </div>
</template>

<script setup lang="ts">
import type {CMS_BlockPages} from "#shared/cms_api"
import AppProjectsPreview__list from "~/components/AppProjectsPreview__list.vue";

defineProps<{
  block_data: CMS_BlockPages,
}>()
</script>


<style scoped lang="scss">
.block-page-list--list {
  width: 100%;
  box-sizing: border-box;
}
</style>
