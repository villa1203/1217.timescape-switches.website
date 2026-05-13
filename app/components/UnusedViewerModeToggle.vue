<template>
  <div class="viewer-controls">
    <button
      @click="emit('update:mode', 'normal')"
      :class="{ active: mode === 'normal' }"
    >
      Normal (hover to see inside)
    </button>
    <button
      @click="emit('update:mode', 'glass')"
      :class="{ active: mode === 'glass' }"
    >
      Frosted Glass
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ mode: string }>()
const emit = defineEmits<{ 'update:mode': [value: string] }>()
</script>
