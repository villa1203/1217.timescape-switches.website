<template>
  <div class="page-elevator">
    <div class="viewer-container">
      <ThreeElevator />
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped lang="scss">
.page-elevator {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.viewer-container {
  width: 800px;
  height: 600px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
</style>
