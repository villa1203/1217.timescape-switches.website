<template>
  <main class="v-research"
  >
    <h1 style="position: fixed; top: 50%;">{{ data?.result }}</h1>
  </main>
</template>


<script setup lang="ts">
import type {CMS_API_Response} from "#shared/cms_api";

type FetchData = CMS_API_Response & {
  "result": {
    research: {
      "title": string,
      "slug": string,
    },
    objects: {
      "title": string,
      "slug": string,
    }[]
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
        }
      },
      objects: {
        query: `page('objects').children`,
        select: {
          title: true,
          slug: true,
        },
      }
    }
  }
})

</script>


<style lang="scss" scoped>
.v-research {
}
</style>
