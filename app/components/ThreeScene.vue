<template>
  <div class="scene-wrapper">
    <canvas ref="canvasRef" class="scene-canvas" />

    <!-- Loading state -->
    <Transition name="fade">
      <div v-if="loading" class="scene-loader">
        <div class="loader-ring" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

/* ─────────────────────────── refs & state ─────────────────────────── */
const canvasRef = ref(null)
const loading   = ref(true)

/* ─────────────────────────── three.js state ───────────────────────── */
let THREE, GLTFLoader, scene, camera, renderer, model, animId
let isDragging = false, lastMouse = { x: 0, y: 0 }
let rotVel = { x: 0, y: 0 }, autoRotate = true, autoRotateTimer = null
let spherical = { theta: 0, phi: Math.PI / 2, radius: 5 }
let modelSize = 1
let minZoom = 0.5
let maxZoom = 2

/* ─────────────────────────── init ────────────────────────────────── */
async function init() {
  // Dynamic import — safe for Nuxt SSR
  THREE = await import('three').then(m => m.default ?? m)
  const { GLTFLoader: Loader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  GLTFLoader = Loader

  const canvas = canvasRef.value
  const W = canvas.clientWidth  || canvas.offsetWidth  || window.innerWidth
  const H = canvas.clientHeight || canvas.offsetHeight || window.innerHeight

  /* Scene */
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  /* Camera */
  camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 200)
  updateCameraPosition()

  /* Renderer */
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W, H, false)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace

  /* Lighting - Bright studio setup for white plastic */
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
  scene.add(ambientLight)

  // Key light - main light from front (same side as camera)
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
  keyLight.position.set(0, 5, 10)  // In front, slightly above
  keyLight.castShadow = true
  keyLight.shadow.mapSize.width = 2048
  keyLight.shadow.mapSize.height = 2048
  keyLight.shadow.camera.near = 0.5
  keyLight.shadow.camera.far = 50
  keyLight.shadow.bias = -0.0001
  scene.add(keyLight)

  // Fill light from left
  const fillLight = new THREE.DirectionalLight(0xffffff, 1.5)
  fillLight.position.set(-8, 3, 5)
  scene.add(fillLight)

  // Fill light from right
  const rightLight = new THREE.DirectionalLight(0xffffff, 1.5)
  rightLight.position.set(8, 3, 5)
  scene.add(rightLight)

  // Top light
  const topLight = new THREE.DirectionalLight(0xffffff, 1.2)
  topLight.position.set(0, 10, 3)
  scene.add(topLight)

  // Slight back light for depth
  const backLight = new THREE.DirectionalLight(0xffffff, 0.8)
  backLight.position.set(0, 2, -8)
  scene.add(backLight)

  /* Load GLB */
  const loader = new GLTFLoader()
  loader.load(
    '/interrupteur.glb',
    (gltf) => {
      model = gltf.scene

      // First pass: calculate bounding boxes to identify tiny parts
      const partSizes = new Map()
      model.traverse((child) => {
        if (child.isMesh) {
          const box = new THREE.Box3().setFromObject(child)
          const size = box.getSize(new THREE.Vector3())
          const volume = size.x * size.y * size.z
          partSizes.set(child, volume)
        }
      })

      // Find the median size to determine what's "tiny"
      const volumes = Array.from(partSizes.values()).sort((a, b) => a - b)
      const smallThreshold = volumes[Math.floor(volumes.length * 0.3)] // Bottom 30% are "tiny"

      // Color palette for tiny parts
      const tinyColors = [
        0x000000, // Black
        0x00ff00, // LED Green
        0xffffff, // Yellow
        0xffffff, // Mint
        0xffffff, // White
        0xffffff, // Purple
        0xffffff, // White
        0xa8d8ea, // Light blue
      ]
      let colorIndex = 0

      // Second pass: apply materials
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true

          // Ensure geometry has proper normals
          if (child.geometry) {
            child.geometry.computeVertexNormals()
          }

          const originalMat = child.material
          const volume = partSizes.get(child)
          let newMaterial

          // Tiny parts get colorful materials
          if (volume <= smallThreshold) {
            newMaterial = new THREE.MeshStandardMaterial({
              color: tinyColors[colorIndex % tinyColors.length],
              metalness: 0,
              roughness: 0.4,
              transparent: false,
              opacity: 1.0,
              side: THREE.DoubleSide,  // Render both sides to prevent see-through
              depthWrite: true,
              depthTest: true,
              alphaTest: 0,
              polygonOffset: true,
              polygonOffsetFactor: 1,
              polygonOffsetUnits: 1,
            })
            colorIndex++
          }
          // Originally metallic parts become black
          else if (originalMat.metalness === 1) {
            newMaterial = new THREE.MeshStandardMaterial({
              color: 0x000000,
              metalness: 0,
              roughness: 0.5,
              transparent: false,
              opacity: 1.0,
              side: THREE.DoubleSide,  // Render both sides to prevent see-through
              depthWrite: true,
              depthTest: true,
              alphaTest: 0,
              polygonOffset: true,
              polygonOffsetFactor: 1,
              polygonOffsetUnits: 1,
            })
          }
          // Everything else is white plastic
          else {
            newMaterial = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0,
              roughness: 0.4,
              transparent: false,
              opacity: 1.0,
              side: THREE.DoubleSide,  // Render both sides to prevent see-through
              depthWrite: true,
              depthTest: true,
              alphaTest: 0,
              polygonOffset: true,
              polygonOffsetFactor: 1,
              polygonOffsetUnits: 1,
            })
          }

          child.material = newMaterial
        }
      })

      // Center the model
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)

      // Calculate model size for zoom constraints
      const size = box.getSize(new THREE.Vector3())
      modelSize = Math.max(size.x, size.y, size.z)

      // Set initial camera distance based on model size
      spherical.radius = modelSize * 2
      minZoom = modelSize * 1.2  // Can't zoom in too close
      maxZoom = modelSize * 4    // Can't zoom out too far

      updateCameraPosition()
      scene.add(model)
      loading.value = false
    },
    undefined,
    (error) => {
      console.error('Error loading GLB:', error)
      loading.value = false
    }
  )

  /* Events */
  window.addEventListener('resize', onResize)
  canvas.addEventListener('mousedown',  onMouseDown)
  canvas.addEventListener('mousemove',  onMouseMove)
  canvas.addEventListener('mouseup',    onMouseUp)
  canvas.addEventListener('mouseleave', onMouseUp)
  canvas.addEventListener('wheel',      onWheel, { passive: true })
  canvas.addEventListener('touchstart', onTouchStart, { passive: true })
  canvas.addEventListener('touchmove',  onTouchMove,  { passive: false })
  canvas.addEventListener('touchend',   onMouseUp)

  animate()
}

/* ─────────────────────────── camera positioning ───────────────────── */
function updateCameraPosition() {
  camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
  camera.position.y = spherical.radius * Math.cos(spherical.phi)
  camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta)
  camera.lookAt(0, 0, 0)
}

/* ─────────────────────────── animation loop ───────────────────────── */
function animate() {
  animId = requestAnimationFrame(animate)

  if (autoRotate) {
    spherical.theta += 0.005
    updateCameraPosition()
  } else {
    spherical.theta += rotVel.x * 0.92
    spherical.phi += rotVel.y * 0.92

    // Clamp phi to prevent camera from flipping
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

    rotVel.x *= 0.92
    rotVel.y *= 0.92
    updateCameraPosition()
  }

  renderer.render(scene, camera)
}

/* ─────────────────────────── resize ───────────────────────────────── */
function onResize() {
  const canvas = canvasRef.value
  if (!canvas) return
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  camera.aspect = W / H
  camera.updateProjectionMatrix()
  renderer.setSize(W, H, false)
}

/* ─────────────────────────── mouse / touch ────────────────────────── */
function onMouseDown(e) {
  isDragging = true
  autoRotate = false
  clearTimeout(autoRotateTimer)
  lastMouse = { x: e.clientX, y: e.clientY }
}

function onMouseMove(e) {
  if (!isDragging) return
  const dx = e.clientX - lastMouse.x
  const dy = e.clientY - lastMouse.y
  rotVel.x = dx * 0.008
  rotVel.y = dy * 0.008
  lastMouse = { x: e.clientX, y: e.clientY }
}

function onMouseUp() {
  isDragging = false
  autoRotateTimer = setTimeout(() => { autoRotate = true }, 2500)
}

function onWheel(e) {
  const delta = e.deltaY * 0.01
  spherical.radius = Math.max(minZoom, Math.min(maxZoom, spherical.radius + delta))
  updateCameraPosition()
}

let touchStart = null
function onTouchStart(e) {
  touchStart = e.touches[0]
  onMouseDown({ clientX: touchStart.clientX, clientY: touchStart.clientY })
}
function onTouchMove(e) {
  e.preventDefault()
  onMouseMove({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })
}

/* ─────────────────────────── lifecycle ────────────────────────────── */
onMounted(() => { init() })

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', onResize)
  if (renderer) renderer.dispose()
  if (model) {
    model.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
  }
})
</script>

<style scoped>
/* ── Layout ─────────────────────────────────────────────────────────── */
.scene-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #ffffff;
  overflow: hidden;
}

.scene-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* ── Loader ──────────────────────────────────────────────────────────── */
.scene-loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
  z-index: 10;
}

.loader-ring {
  width: 42px;
  height: 42px;
  border: 2px solid rgba(0, 0, 0, 0.15);
  border-top-color: #000000;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Transitions ─────────────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>