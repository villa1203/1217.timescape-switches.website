<template>
	<section class="v-block block-bullet-point" >

    <header v-if="block_data.content.title" class="block-bullet-point__header">
      <h2><StickerParagraph :text="block_data.content.title" /></h2>
    </header>

    <div class="block-bullet-point__items">
      <div
        v-for="(item, i) of block_data.content.bullet_points_list"
        :key="i"
        class="block-bullet-point__item"
      >
        <div class="block-bullet-point__item__title">
          <h3 v-if="item.title"><StickerParagraph :text="item.title" size="sm" /></h3>
        </div>
        <div v-if="item.text" class="body-1 block-bullet-point__item__text" v-html="item.text" />
      </div>
    </div>

	</section>
</template>

<script setup lang="ts">
import type { CMS_BlockBulletPointsData } from "#shared/cms_api"

defineProps<{
  block_data: CMS_BlockBulletPointsData
}>()
</script>

<style scoped lang="scss">
.block-bullet-point {
  // Spacing between each title+text group, and between a title and its text.
  --block-bullet-point-row-gap: 2.5rem;
  --block-bullet-point-item-gap: 0.5rem;

  box-sizing: border-box;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.block-bullet-point__header {
  width: 100%;
  margin-bottom: 2rem;
}

.block-bullet-point__items {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  column-gap: var(--app-grid-gap, 2rem);
  // Larger vertical spacing between each title+text group so the groups
  // read as distinct blocks rather than running together.
  row-gap: var(--block-bullet-point-row-gap);
}

.block-bullet-point__item {
  display: flex;
  flex-direction: column;
  // Consistent spacing between a group's title and its text.
  gap: var(--block-bullet-point-item-gap);
}

.block-bullet-point__item__title {
  h3 {
    margin: 0;
  }
}

.block-bullet-point__item__text :deep(ul) {
  list-style: none;
  padding-left: 0;
  margin: 0;
}

.block-bullet-point__item__text :deep(p) {
  margin: 0;
}


.block-bullet-point__item__text :deep(a:hover) {
  text-decoration: none;
}
</style>
