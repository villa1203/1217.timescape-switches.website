<template>
  <div class="v-block block-profiles">
    {{block_data.content.profiles_list}}
    <div v-for="profile of block_data.content.profiles_list">
      <img
        v-if="profile.photo"
        :src="profile.photo.reg.url"
        :alt="profile.photo.alt ?? ''"
      />

      <div>{{ profile.first_name }} {{ profile.last_name }}</div>
      <div>{{ profile.function }}</div>

      <div v-if="profile.roles"
           v-html="profile.roles"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type {CMS_BlockProfiles} from "#shared/cms_api"

defineProps<{
  block_data: CMS_BlockProfiles,
}>()
</script>

<style scoped lang="scss">
.block-profiles {
  width: 100%;
  box-sizing: border-box;
}
</style>
