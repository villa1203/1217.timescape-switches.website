<template>
  <main class="v-shabbat"
  >

    <AppLayoutColumns>
      <template v-slot:first>
        <Blocks
          v-if="data?.result?.content_secondary"
          :content="data?.result?.content_secondary"
          :sticker="true"
        />
      </template>
      <template v-slot:second>
        <Blocks
          v-if="data?.result?.content"
          :content="data?.result?.content"
        />
      </template>
    </AppLayoutColumns>

  </main>
</template>


<script setup lang="ts">
import type {CMS_API_Response, CMS_BlockData} from "#shared/cms_api";
import AppLayoutColumns from "~/components/AppLayoutColumns.vue";
import { seoSelect, siteSeoSelect } from "#shared/KQLQueries";
import { useCmsSeo, type CmsSeoFields, type CmsSiteSeo } from "~/composables/useCmsSeo";

type FetchData = CMS_API_Response & {
  result: {
    title: string
    slug: string
    content: CMS_BlockData[]
    content_secondary: CMS_BlockData[]
    site: CmsSiteSeo
  } & CmsSeoFields
}

const {data} = useFetch<FetchData>('/api/CMS_KQLRequest', {
  // Not lazy: SEO meta must be in the server-rendered HTML for crawlers.
  method: 'POST',
  body: {
    query: `page('shabbat-as-a-time-ritual')`,
    select: {
      title: true,
      slug: true,
      content: {
        query: `page.content.content.toBlocks`,
      },
      content_secondary: {
        query: `page.content.content_secondary.toBlocks`,
      },
      ...seoSelect('page'),
      site: { query: 'site', select: siteSeoSelect() },
    }
  }
})

useCmsSeo(() => ({
  page: data.value?.result,
  site: data.value?.result?.site,
  path: '/shabbat-as-a-time-ritual',
  fallbackTitle: data.value?.result?.title,
}))

</script>


<style lang="scss" scoped>
.v-shabbat {
}
</style>
