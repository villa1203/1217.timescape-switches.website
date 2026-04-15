<template>
  <main class="v-slug"
  >
    <p>title: {{ data?.result.title }}</p>
    <p>slug: {{ data?.result.slug }}</p>
    <p>content: {{ data?.result.content }}</p>
    <p>strategies: {{ data?.result.strategies }}</p>
    <p>production: {{ data?.result.production }}</p>
    <p>pre_commitment: {{ data?.result.pre_commitment }}</p>
    <p>delegated_agency: {{ data?.result.delegated_agency }}</p>
    <p>action_and_effect: {{ data?.result.action_and_effect }}</p>
    <p>baseline: {{ data?.result.baseline }}</p>
    <p>cover_front: {{ data?.result.cover_front }}</p>
    <p>cover_back: {{ data?.result.cover_back }}</p>
  </main>
</template>


<script setup lang="ts">

import {KQL_PROJECTS_SELECT} from "#shared/KQLQueries";
import type {CMS_API_ImageInstance, CMS_API_Response, CMS_BlockData} from "#shared/cms_api";

type FetchData = CMS_API_Response & {
  "result": {
    title: string,
    slug: string,
    content: CMS_BlockData[],
    strategies: string
    production: string
    pre_commitment: string
    delegated_agency: string
    action_and_effect: string
    baseline: string
    cover_front: CMS_API_ImageInstance[]
    cover_back: CMS_API_ImageInstance[]
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
