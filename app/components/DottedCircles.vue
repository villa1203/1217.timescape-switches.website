<script setup lang="ts">
defineProps<{
  color?: string
}>()
</script>

<template>
  <svg
    class="dotted-circles"
    viewBox="0 0 1565 713"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid meet"
  >
    <!-- Ellipse gauche -->
    <ellipse
      cx="146" cy="356" rx="145.5" ry="355.5"
      :stroke="color || 'black'"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-dasharray="10 10"
    />
    <!-- Cercle gauche -->
    <circle
      cx="423" cy="357" r="355"
      :stroke="color || 'black'"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-dasharray="10 10"
    />
    <!-- Cercle centre -->
    <circle
      cx="781" cy="357" r="355"
      :stroke="color || 'black'"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-dasharray="10 10"
    />
    <!-- Cercle droit -->
    <circle
      cx="1138" cy="357" r="355"
      :stroke="color || 'black'"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-dasharray="10 10"
    />
    <!-- Ellipse droite -->
    <ellipse
      cx="1419" cy="356" rx="145.5" ry="355.5"
      :stroke="color || 'black'"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-dasharray="10 10"
    />
  </svg>
</template>

<style scoped>
.dotted-circles {
  width: 100%;
  height: auto;
}

.dotted-circles circle,
.dotted-circles ellipse {
  animation: rotate-dots 20s linear infinite;
}

.dotted-circles circle:nth-child(2) {
  animation-duration: 25s;
  animation-direction: reverse;
}

.dotted-circles circle:nth-child(3) {
  animation-duration: 30s;
}

.dotted-circles circle:nth-child(4) {
  animation-duration: 22s;
  animation-direction: reverse;
}

.dotted-circles ellipse:nth-child(1) {
  animation-duration: 18s;
}

.dotted-circles ellipse:nth-child(5) {
  animation-duration: 18s;
  animation-direction: reverse;
}

@keyframes rotate-dots {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: 100;
  }
}
</style>
