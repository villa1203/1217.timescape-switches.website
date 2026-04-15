<template>
    <div class="v-nav"
    >
      <div class="app-grid app-grid--justify-between">

        <nuxt-link to="/">logo</nuxt-link>

        <nav class="app-grid app-grid--justify-end app-grid--gap-small">
          <StickerButton text="Research" to="/Research" :font-size="24" :stroke-width="20" />
          <StickerButton text="Info" to="Info" :font-size="24" :stroke-width="20" />
          <StickerButton text="Design Research On Ritual Constraints And Domestic Technology" to="/onverra" :font-size="24" :stroke-width="20" />
        </nav>

      </div>
    </div>
</template>





<script setup lang="ts">
defineProps<{
    message?: string
}>()
</script>





<style lang="scss" scoped >
.v-nav {
}
</style>
