<template>
  <main class="v-slug">
    <div class="app-grid app-grid--align-center v-slug__layout">

      <div class="app-grid__col-6 v-slug__col-image">
        <ImageHover
          v-if="data?.result.cover_front[0] && data?.result.cover_back[0]"
          :src="data.result.cover_front[0].xxl.url"
          :src-hover="data.result.cover_back[0].xxl.url"
          :alt="data.result.cover_front[0].alt ?? data.result.title"
          :blob-size="400"
        />
      </div>

      <div class="app-grid__col-6 v-slug__col-text">
        <h1 class="v-slug__title">{{ data?.result.title }}</h1>
        <p v-if="data?.result.baseline" class="v-slug__baseline">{{ data.result.baseline }}</p>

        <div class="v-slug__meta">
          <div>
            <dt>Strategies</dt>
            <dd>{{ data?.result.strategies }}</dd>
          </div>
          <div>
            <dt>Production</dt>
            <dd>{{ data?.result.production }}</dd>
          </div>
          <div>
            <dt>Pre-commitment</dt>
            <dd>{{ data?.result.pre_commitment }}</dd>
          </div>
          <div>
            <dt>Delegated agency</dt>
            <dd>{{ data?.result.delegated_agency }}</dd>
          </div>
          <div>
            <dt>Action & effect</dt>
            <dd>{{ data?.result.action_and_effect }}</dd>
          </div>
        </div>

        <div class="v-slug__content"
             v-if="data?.result.content"
        >
          <Blocks
            :content="data.result.content"
          />
        </div>

      </div>

    </div>
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

  &__layout {
    min-height: 100vh;
  }

  &__col-image {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  &__col-text {
    padding: 4rem 2rem;
  }

  &__title {
    margin-bottom: 0.5rem;
  }

  &__baseline {
    margin-bottom: 2rem;
    opacity: 0.6;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    dt {
      opacity: 0.5;
      white-space: nowrap;
    }
  }
}
</style>
