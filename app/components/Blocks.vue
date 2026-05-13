<template>
  <div class="app-blocks">
    <template v-for="block of content" :key="block.id">
      <template v-if="block.type === 'article_heading'">
        <BlockArticleHeading
          :block_data="block"
        />
      </template>

      <template v-else-if="block.type === 'image'">
        <BlockImage :block_data="block"/>
      </template>

      <template v-else-if="block.type === 'gallery'">
        <BlockGallery :block_data="block"/>
      </template>

      <template v-else-if="block.type === 'text'">
        <BlockText :block_data="block" :sticker="sticker"/>
      </template>

      <template v-else-if="block.type === 'video'">
        <BlockVideo :block_data="block"/>
      </template>

      <template v-else-if="block.type === 'pages_list'">
        <template v-if="block.content.is_style_list">
          <BlockPagesList__list :block_data="block"/>
        </template>
        <template v-else>
          <BlockPagesList :block_data="block"/>
        </template>
      </template>

      <template v-else-if="block.type === 'clients_list'">
        <BlockClientList :block_data="block"/>
      </template>

      <template v-else-if="block.type === 'profiles'">
        <BlockProfiles :block_data="block"/>
      </template>

      <template v-else-if="block.type === 'bullet_points'">
        <BlockBulletPoint :block_data="block"/>
      </template>

    </template>
  </div>
</template>

<script setup lang="ts">
	import type {CMS_BlockData} from "#shared/cms_api";
  import BlockPagesList__list from "~/components/BlockPagesList__list.vue";
  import BlockClientList from "~/components/BlockClientList.vue";

	defineProps<{
		content: CMS_BlockData[]
		sticker?: boolean
	}>();

</script>

<style scoped lang="scss">
.app-blocks {
  display: flex;
  flex-direction: row;
  row-gap: var(--app-row-gap);
  column-gap: var(--app-grid-gap);
  flex-wrap: wrap;
}
</style>
