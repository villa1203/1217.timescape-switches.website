<template>
  <main class="v-info">
    <!-- 3D Viewer Section -->
    <div class="viewer-section">
      <div class="viewer-controls">
        <button
          @click="viewerMode = 'normal'"
          :class="{ active: viewerMode === 'normal' }"
        >
          Normal (hover X-ray)
        </button>
        <button
          @click="viewerMode = 'glass'"
          :class="{ active: viewerMode === 'glass' }"
        >
          Frosted Glass
        </button>
      </div>

      <!-- Model Selector -->
      <div class="model-selector">
        <button
          @click="currentModel = 'interrupteur'"
          :class="{ active: currentModel === 'interrupteur' }"
        >
          Interrupteur
        </button>
        <button
          @click="currentModel = 'elevator'"
          :class="{ active: currentModel === 'elevator' }"
        >
          Elevator
        </button>
      </div>

      <ThreeSwitch
        v-if="currentModel === 'interrupteur'"
        :key="'interrupteur'"
        :mode="viewerMode"
      />
      <ThreeElevator
        v-if="currentModel === 'elevator'"
        :key="'elevator'"
        :mode="viewerMode"
      />
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const viewerMode = ref('normal')
const currentModel = ref('interrupteur')
</script>

<style lang="scss" scoped>
.v-info {
  .viewer-section {
    position: relative;
    width: 100%;
    height: 100vh;
  }

  .viewer-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 100;
    display: flex;
    gap: 10px;
  }

  .viewer-controls button {
    padding: 10px 20px;
    background: white;
    border: 2px solid #000;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    transition: all 0.2s;
  }

  .viewer-controls button:hover {
    background: #f0f0f0;
  }

  .viewer-controls button.active {
    background: #000;
    color: #fff;
  }

  .model-selector {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 100;
    display: flex;
    gap: 10px;
  }

  .model-selector button {
    padding: 10px 20px;
    background: white;
    border: 2px solid #000;
    cursor: pointer;
    font-family: inherit;
    font-size: 14px;
    transition: all 0.2s;
  }

  .model-selector button:hover {
    background: #f0f0f0;
  }

  .model-selector button.active {
    background: #000;
    color: #fff;
  }
}
</style>
