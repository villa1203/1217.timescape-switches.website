<template>
  <div>
    <h2>{{block_data.content.title}}</h2>

    <div>
      <div v-for="client of data?.result?.content">
        {{client.title}}
        <img :src="client.logo?.reg.url"
        />
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type {CMS_API_ImageInstance, CMS_API_Response, CMS_BlockClientList} from "#shared/cms_api"

defineProps<{
  block_data: CMS_BlockClientList,
}>()

type FetchData = CMS_API_Response & {
  "result"?: {
    "title"?: string,
    "slug"?: string,
    content?: {
      title?: string,
      logo?: CMS_API_ImageInstance
    }[],
  }
}

const {data} = useFetch<FetchData>('/api/CMS_KQLRequest', {
  lazy: true,
  method: 'POST',
  body: {
    query: `page('clients')`,
    select: {
      title: true,
      slug: true,
      content: {
        query: 'page.children',
        select: {
          title: true,
          logo: {
            query: `page.logo.toFiles.first`,
            select: {
              alt: "file.alt.value",
              tiny: 'file.resize(50, null, 10)',
              small: 'file.resize(500)',
              reg: 'file.resize(1280)',
              large: 'file.resize(1920)',
              xxl: 'file.resize(2500)',
              focus: 'file.focus',
            }
          }
        }
      },
    },
  },
})

</script>
