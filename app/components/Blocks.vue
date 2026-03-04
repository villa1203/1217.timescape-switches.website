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

      <template v-else-if="block.type === 'text'">
        <BlockText :block_data="block"/>
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

      <template v-else-if="block.type === 'sketch_text'">
        <div style="margin-top: calc( -1 * var(--app-row-gap)); margin-bottom: calc( -1 * var(--app-row-gap))">
          <iframe
            style="
              border: none;
              width: 100%;
              height: 100vh;
            "
            src="/sketches/intro/index.html"/>
        </div>
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
	}>();

</script>

<style scoped lang="scss">
.app-blocks {
  display: flex;
  flex-direction: column;
  gap: var(--app-row-gap);
}
</style>
