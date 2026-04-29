<template>
	<section class="v-block block-article-heading app-grid app-grid--align-start" >

    <div class="app-grid app-grid--align-start app-grid--justify-center">
      <header v-if="block_data.content.title"
              :class="{
                'app-grid__col-6': block_data.content.text
              }"
      >
        <div class="app-grid app-grid--align-start app-grid--justify-center app-rm-child-margin">
          <h2
            :class="{
                'app-text-align-center': !block_data.content.text
            }"
          >{{ block_data.content.title }}</h2>
        </div>
      </header>

      <div v-if="block_data.content.text"
           :class="{
              'app-grid__col-6': block_data.content.title,
              'app-grid__col-12': !block_data.content.title,
            }"
      >
        <div v-html="block_data.content.text"/>
      </div>
    </div>

	</section>
</template>

<script setup lang="ts">
	import type {CMS_BlockArticleHeadingData} from "#shared/cms_api"

	defineProps<{
		block_data: CMS_BlockArticleHeadingData
	}>()
</script>

<style scoped lang="scss">
.block-article-heading {
  width: 100%;
  box-sizing: border-box;
  min-height: calc(100vh - 20rem);
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
