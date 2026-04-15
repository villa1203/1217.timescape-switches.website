<template>
  <main class="v-index"
  >
    <P5Background />

    <div class="hero">
      <DottedCircles class="hero-circles" />
      <img src="/TexteTMSHOME.svg" alt="Timescape" class="hero-svg" />
    </div>

    <!-- Test ImageHover -->
    <div class="test-hover">
      <ImageHover
        src="/Images/OBJET TMS WEB_Kettle 1.png"
        src-hover="/Images/OBJET TMS WEB_Kettle 2.png"
        alt="Kettle"
        :blob-size="300"
      />
    </div>

    <div>
      <Blocks :content="data?.result.content || []" />
    </div>
  </main>
</template>


<script setup lang="ts">
import type {CMS_API_ImageInstance, CMS_API_Response, CMS_BlockData} from "#shared/cms_api";
import {KQL_QUERY_BLOCKS} from "#shared/KQLQueries";

type FetchData = CMS_API_Response & {
  "result": {
    "title": string,
    "slug": string,
    content: CMS_BlockData[],
  }
}


const {data} = useFetch<FetchData>('/api/CMS_KQLRequest', {
  lazy: true,
  method: 'POST',
  body: {
    query: `page('home')`,
    select: {
      title: true,
      slug: true,
      baseline: true,
      content: KQL_QUERY_BLOCKS
    }
  }
})

// type ResolvedPage = {
//   id: string,
//   title: string,
//   slug: string,
//   url: string,
// }
//
// const resolvedPagesMap: ComputedRef<Map<string, ResolvedPage[]>> = computed(() => {
//   const map = new Map<string, ResolvedPage[]>()
//
//   for (const block of data.value?.result.home.pages_list_blocks ?? []) {
//     map.set(block.id, block.resolved_pages)
//   }
//   return map
// })


</script>


<style lang="scss" scoped>
.v-index {
}

.hero {
  position: relative;
  width: 100%;
  padding: 4rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-circles {
  position: absolute;
  width: 90%; 
  height: auto;
  z-index: 0;
}

.hero-svg {
  position: relative;
  width: 80%;
  height: auto;
  z-index: 1;
}

.test-hover {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}
</style>
