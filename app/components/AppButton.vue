<template>
  <button
    class="v-app-custom-button"
    :class="{ 'v-app-custom-button--active': is_active }"
  >
    <span class="v-app-custom-button__round"></span>
    <span class="v-app-custom-button__text"
          :class="{
            'app-color-grey': !is_active,
          }"
    ><slot/></span>
  </button>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  is_active: boolean,
}>()
</script>

<style scoped>
.v-app-custom-button {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  background: transparent;
  color: var(--app-color-dark);
}

.v-app-custom-button__round {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #ccc;
  margin-right: 0.5rem;
}

.v-app-custom-button--active {
  border-color: var(--app-color-dark);
}

.v-app-custom-button--active .v-app-custom-button__round {
  background-color: var(--app-color-dark);
}
</style>
