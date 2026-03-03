<template>
  <main class="v-app"
  >
    <div>
      <Nav/>
    </div>
    {{`${useRuntimeConfig().public.apiBase}/api/query`}}
    <div>
      <NuxtPage/>
    </div>
  </main>
</template>


<script setup lang="ts">

</script>


<style lang="scss" scoped>
.v-app {
}
</style>
