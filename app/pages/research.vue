<template>
  <main class="v-research"
  >

    <AppLayoutColumns>
      <template v-slot:first>
        <Blocks
          v-if="data?.result.research.content_secondary"
          :content="data?.result.research.content_secondary"
          :sticker="true"
        />
      </template>
      <template v-slot:second>
        <Blocks
          v-if="data?.result.research.content"
          :content="data?.result.research.content"
        />
      </template>
    </AppLayoutColumns>

  </main>
</template>


<script setup lang="ts">
import type {CMS_API_Response, CMS_BlockData} from "#shared/cms_api";
import AppLayoutColumns from "~/components/AppLayoutColumns.vue";

type FetchData = CMS_API_Response & {
  result: {
    research: {
      title: string
      slug: string
      content: CMS_BlockData[]
      content_secondary: CMS_BlockData[]
    }
  }
}

const {data} = useFetch<FetchData>('/api/CMS_KQLRequest', {
  lazy: true,
  method: 'POST',
  body: {
    query: `site()`,
    select: {
      research: {
        query: `page('research')`,
        select: {
          title: true,
          slug: true,
          content: {
            query: `page('research').content.content.toBlocks`,
          },
          content_secondary: {
            query: `page('research').content.content_secondary.toBlocks`,
          },
        }
      },
    }
  }
})

</script>


<style lang="scss" scoped>
.v-research {
}
</style>
