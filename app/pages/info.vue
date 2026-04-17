<template>
  <main class="v-info"
  >
    <p>{{ data?.result.title }}</p>
  </main>
</template>


<script setup lang="ts">
import type {CMS_API_Response} from "#shared/cms_api";

type FetchData = CMS_API_Response & {
  "result": {
    "title": string,
    "slug": string,
  }
}

const {data} = useFetch<FetchData>('/api/CMS_KQLRequest', {
  lazy: true,
  method: 'POST',
  body: {
    query: `page('infos')`,
    select: {
      title: true,
      slug: true,
    }
  }
})

</script>


<style lang="scss" scoped>
.v-info {
}
</style>
