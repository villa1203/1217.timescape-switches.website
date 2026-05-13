<template>
  <button
    v-if="isObjectPage"
    class="transparent-toggle"
    :class="{ 'is-on': isOn }"
    :aria-pressed="isOn"
    aria-label="Toggle transparent 3D"
    @click="toggle"
  >
    <img
      :src="isOn ? '/Button Switch shabbat On.svg' : '/Button Switch shabbat Off.svg'"
      alt=""
      class="transparent-toggle__img"
    />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTransparentMode } from '~/composables/useTransparentMode'

const { isOn, toggle } = useTransparentMode()
const route = useRoute()
const isObjectPage = computed(() => route.path.startsWith('/objects/'))
</script>

<style scoped lang="scss">
.transparent-toggle {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 150;

  background: none;
  border: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  line-height: 0;
}

.transparent-toggle__img {
  display: block;
  width: 5rem;
  height: auto;
  transition: transform 0.2s ease;
}

.transparent-toggle:hover .transparent-toggle__img {
  transform: scale(1.05);
}
</style>
