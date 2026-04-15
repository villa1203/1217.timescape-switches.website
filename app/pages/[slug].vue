<template>
  <main class="v-slug"
  >
    <p>{{ data }}</p>
  </main>
</template>


<script setup lang="ts">

import {KQL_PROJECTS_SELECT} from "#shared/KQLQueries";
import type {CMS_API_ImageInstance, CMS_API_Response, CMS_BlockData} from "#shared/cms_api";

type FetchData = CMS_API_Response & {
  "result": {
    title: string,
    slug: string,
    baseline: string,
    intro: string,
    cover: CMS_API_ImageInstance,
    content: CMS_BlockData[],
    sectors: {title: string}[]
    clients: {title: string}[]
    collaborators: {title: string}[]
    services: {title: string}[]
    date: string
    localisation: string
    photo_credits: string
    link_to_project: string
  }
}

const route = useRoute()

const {data} = await useFetch<FetchData>('/api/CMS_KQLRequest', {
  lazy: true,
  method: 'POST',
  body: {
    query: `page('objects/${route.params.slug}')`,
    select: KQL_PROJECTS_SELECT,
  }
})

</script>


<style lang="scss" scoped>
.v-slug {
}
</style>
