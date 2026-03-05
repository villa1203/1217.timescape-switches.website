<template>
  <main class="v-projet-slug"
  >
    <template v-if="data && data.result">
      <header class="v-projet-slug__header"
      >
        <img class="v-projet-slug__img"
             :src="data.result.cover.xxl.url">

        <div class="v-projet-slug__intro app-grid app-with-padding--left-right app-max-width-reg app-margin-left-right-auto">
          <div class="app-grid__col-10 app-child-no-margin">
            <h1>{{ data.result.title }}</h1>
            <div v-html="data.result.intro" />
            <div class="app-grid app-grid--wrap v-projet-slug__collaborators">
              <div class="app-grid__col-6"
                   v-for="collaborator of data.result.collaborators">
                {{collaborator.title}}</div>
            </div>
          </div>
          <div class="app-grid__col-2">
            <div class="app-grid app-grid--direction-column">
              <div v-if="data.result.clients">
                <h4 style="margin: 0">Client</h4>
                <div v-for="client of data.result.clients">
                  {{ client.title }}
                </div>
              </div>

              <div v-if="data.result.date">
                <h4 style="margin: 0">Period</h4>
                {{ formaterDate(data.result.date)  }}
              </div>

              <div v-if="data.result.services">
                <h4 style="margin: 0">Expertise</h4>
                <div v-for="service of data.result.services">
                  {{ service.title }}
                </div>
              </div>

              <div v-if="data.result.localisation">
                <h4 style="margin: 0">Localisation</h4>
                {{ data.result.localisation }}
              </div>

              <div v-if="data.result.photo_credits">
                <h4 style="margin: 0">photo credits</h4>
                {{ data.result.photo_credits }}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div class="app-grid app-grid--align-start app-grid--justify-start">
        <div class="app-grid__col-12">
          <Blocks
            :content="data.result.content"
          />
        </div>
      </div>
    </template>
    <div v-else>
      <h1>oups, no page here</h1>
    </div>
  </main>
</template>


<script setup lang="ts">

import type {CMS_API_ImageInstance, CMS_API_Response, CMS_BlockData, CMS_BlockDataBase} from "#shared/cms_api";
import {formaterDate} from "#shared/date_formatter";
import {KQL_PROJECTS_SELECT, KQL_QUERY_BLOCKS} from "#shared/KQLQueries";

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
  }
}

const route = useRoute()

const {data} = await useFetch<FetchData>('/api/CMS_KQLRequest', {
  lazy: true,
  method: 'POST',
  body: {
    query: `page('projects/${route.params.slug}')`,
    select: KQL_PROJECTS_SELECT,
  }
})

</script>


<style lang="scss" scoped>
.v-projet-slug__img {
  display: block;
  width: 100%;
  height: 100vh;
  object-fit: cover;
}

.v-projet-slug__intro {
  padding-top: var(--app-gutter);
  padding-bottom: var(--app-gutter);
}

.v-projet-slug__collaborators {
  max-width: 30rem;
}
</style>
