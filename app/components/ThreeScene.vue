<template>
  <div class="scene-wrapper">
    <!-- Base layer: X-ray view (always visible behind) -->
    <canvas ref="xrayCanvasRef" class="scene-canvas xray-layer" />

    <!-- Top layer: Normal white plastic with circular mask -->
    <canvas ref="canvasRef" class="scene-canvas normal-layer" :style="maskStyle" />

    <!-- Loading state -->
    <Transition name="fade">
      <div v-if="loading" class="scene-loader">
        <div class="loader-ring" />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

/* ─────────────────────────── props ────────────────────────────────── */
const props = defineProps({
  // 'normal' | 'glass'
  mode: {
    type: String,
    default: 'normal'
  },
  xrayRadius: {
    type: Number,
    default: 0.08  // Radius in normalized screen coordinates (0-1)
  },
  xrayBlur: {
    type: Number,
    default: 0.03  // Blur edge width
  }
})

/* ─────────────────────────── refs & state ─────────────────────────── */
const canvasRef = ref(null)
const xrayCanvasRef = ref(null)
const loading   = ref(true)
const maskStyle = ref({})

/* ─────────────────────────── three.js state ───────────────────────── */
let THREE, GLTFLoader, scene, xrayScene, camera, renderer, xrayRenderer, model, xrayModel, animId
let isDragging = false, lastMouse = { x: 0, y: 0 }
let rotVel = { x: 0, y: 0 }, autoRotate = true, autoRotateTimer = null
let spherical = { theta: 0, phi: Math.PI / 2, radius: 5 }
let modelSize = 1
let minZoom = 0.5
let maxZoom = 2

/* ─────────────────────────── transparency state ────────────────────── */
let normalMaterials = new Map()  // Store original materials
let glassMaterials = new Map()   // Store glass versions

/* ─────────────────────────── material management ───────────────────── */
function switchToNormalMode() {
  if (!model) return
  // Restore original white plastic materials
  model.traverse((child) => {
    if (child.isMesh && normalMaterials.has(child)) {
      child.material = normalMaterials.get(child)
      // Enable transparency for X-ray effect
      child.material.transparent = true
    }
  })
}

function switchToGlassMode() {
  if (!model) return
  model.traverse((child) => {
    if (child.isMesh) {
      if (!glassMaterials.has(child)) {
        const originalMat = normalMaterials.get(child)
        let glassMat

        // Black parts become purple, everything else is frosted gray
        if (originalMat && originalMat.color.getHex() === 0x000000) {
          glassMat = new THREE.MeshStandardMaterial({
            color: 0x8210c1,  // Purple for black parts
            metalness: 0.0,
            roughness: 0.7,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        } else {
          glassMat = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0,  // Light gray frosted color
            metalness: 0.0,
            roughness: 0.7,   // High roughness for strong frosted effect
            transparent: true,
            opacity: 0.4,     // Semi-transparent frosted glass
            side: THREE.DoubleSide,
            depthWrite: false
          })
        }

        glassMaterials.set(child, glassMat)
      }
      child.material = glassMaterials.get(child)
    }
  })
}


/* ─────────────────────────── init ────────────────────────────────── */
async function init() {
  // Dynamic import — safe for Nuxt SSR
  THREE = await import('three').then(m => m.default ?? m)
  const { GLTFLoader: Loader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  GLTFLoader = Loader

  const canvas = canvasRef.value
  const xrayCanvas = xrayCanvasRef.value
  const W = canvas.clientWidth  || canvas.offsetWidth  || window.innerWidth
  const H = canvas.clientHeight || canvas.offsetHeight || window.innerHeight

  /* Normal Scene (white plastic) */
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xffffff)

  /* X-ray Scene (transparent with colored internals) */
  xrayScene = new THREE.Scene()
  xrayScene.background = new THREE.Color(0xffffff)

  /* Shared Camera */
  camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 200)
  updateCameraPosition()

  /* Normal Renderer (top layer) */
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W, H, false)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace

  /* X-ray Renderer (bottom layer) */
  xrayRenderer = new THREE.WebGLRenderer({ canvas: xrayCanvas, antialias: true, alpha: false })
  xrayRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  xrayRenderer.setSize(W, H, false)
  xrayRenderer.shadowMap.enabled = true
  xrayRenderer.shadowMap.type = THREE.PCFSoftShadowMap
  xrayRenderer.outputColorSpace = THREE.SRGBColorSpace

  /* Lighting - Bright studio setup (add to both scenes) */
  function addLights(targetScene) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0)
    targetScene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5)
    keyLight.position.set(0, 5, 10)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 2048
    keyLight.shadow.mapSize.height = 2048
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 50
    keyLight.shadow.bias = -0.0001
    targetScene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5)
    fillLight.position.set(-8, 3, 5)
    targetScene.add(fillLight)

    const rightLight = new THREE.DirectionalLight(0xffffff, 1.5)
    rightLight.position.set(8, 3, 5)
    targetScene.add(rightLight)

    const topLight = new THREE.DirectionalLight(0xffffff, 1.2)
    topLight.position.set(0, 10, 3)
    targetScene.add(topLight)

    const backLight = new THREE.DirectionalLight(0xffffff, 0.8)
    backLight.position.set(0, 2, -8)
    targetScene.add(backLight)
  }

  addLights(scene)
  addLights(xrayScene)

  /* Load GLB */
  const loader = new GLTFLoader()
  loader.load(
    '/interrupteur.glb',
    (gltf) => {
      model = gltf.scene
      xrayModel = gltf.scene.clone()  // Clone for x-ray layer

      // First pass: calculate bounding boxes to identify tiny parts
      const partSizes = new Map()
      const xrayPartSizes = new Map()

      model.traverse((child) => {
        if (child.isMesh) {
          const box = new THREE.Box3().setFromObject(child)
          const size = box.getSize(new THREE.Vector3())
          const volume = size.x * size.y * size.z
          partSizes.set(child, volume)
        }
      })

      xrayModel.traverse((child) => {
        if (child.isMesh) {
          const box = new THREE.Box3().setFromObject(child)
          const size = box.getSize(new THREE.Vector3())
          const volume = size.x * size.y * size.z
          xrayPartSizes.set(child, volume)
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
      let xrayColorIndex = 0

      // Apply COLORED materials to normal model (top layer - what you see normally)
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true

          if (child.geometry) {
            child.geometry.computeVertexNormals()
          }

          const originalMat = child.material
          const volume = partSizes.get(child)
          let normalMaterial

          // Tiny parts get colorful materials
          if (volume <= smallThreshold) {
            normalMaterial = new THREE.MeshStandardMaterial({
              color: tinyColors[colorIndex % tinyColors.length],
              metalness: 0,
              roughness: 0.4,
              side: THREE.DoubleSide,
            })
            colorIndex++
          }
          // Originally metallic parts become black
          else if (originalMat.metalness === 1) {
            normalMaterial = new THREE.MeshStandardMaterial({
              color: 0x000000,
              metalness: 0,
              roughness: 0.5,
              side: THREE.DoubleSide,
            })
          }
          // Everything else is white plastic
          else {
            normalMaterial = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0,
              roughness: 0.4,
              side: THREE.DoubleSide,
            })
          }

          child.material = normalMaterial
          normalMaterials.set(child, normalMaterial)
        }
      })

      // Apply FROSTED GLASS to X-ray model (bottom layer - revealed through circle)
      xrayModel.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true

          if (child.geometry) {
            child.geometry.computeVertexNormals()
          }

          // All parts are frosted glass in X-ray view
          const glassXrayMaterial = new THREE.MeshStandardMaterial({
            color: 0xe0e0e0,  // Light gray frosted color
            metalness: 0.0,
            roughness: 0.7,   // High roughness for strong frosted effect
            transparent: true,
            opacity: 0.4,     // Semi-transparent frosted glass
            side: THREE.DoubleSide,
            depthWrite: false
          })

          child.material = glassXrayMaterial
        }
      })

      // Center both models
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)
      xrayModel.position.sub(center)

      // Calculate model size for zoom constraints
      const size = box.getSize(new THREE.Vector3())
      modelSize = Math.max(size.x, size.y, size.z)

      // Set initial camera distance based on model size
      spherical.radius = modelSize * 2
      minZoom = modelSize * 1.2  // Can't zoom in too close
      maxZoom = modelSize * 4    // Can't zoom out too far

      updateCameraPosition()

      // Add models to their respective scenes
      scene.add(model)
      xrayScene.add(xrayModel)

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

  // Render both layers
  if (props.mode === 'normal') {
    xrayRenderer.render(xrayScene, camera)  // X-ray layer (bottom)
    renderer.render(scene, camera)          // Normal layer (top with mask)
  } else {
    // In glass mode, only render normal scene
    renderer.render(scene, camera)
  }
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
  if (xrayRenderer) {
    xrayRenderer.setSize(W, H, false)
  }
}

/* ─────────────────────────── mouse / touch ────────────────────────── */
function onMouseDown(e) {
  isDragging = true
  autoRotate = false
  clearTimeout(autoRotateTimer)
  lastMouse = { x: e.clientX, y: e.clientY }
}

function onMouseMove(e) {
  // Handle rotation first
  if (isDragging) {
    const dx = e.clientX - lastMouse.x
    const dy = e.clientY - lastMouse.y
    rotVel.x = dx * 0.008
    rotVel.y = dy * 0.008
    lastMouse = { x: e.clientX, y: e.clientY }
  }

  // Update X-ray effect - apply circular CSS mask to top canvas
  const canvas = canvasRef.value
  if (canvas && props.mode === 'normal') {
    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Radius in pixels
    const radiusPx = Math.min(rect.width, rect.height) * props.xrayRadius
    const blurPx = Math.min(rect.width, rect.height) * props.xrayBlur

    // Create radial gradient mask: transparent circle at mouse (reveals x-ray below), opaque everywhere else
    maskStyle.value = {
      maskImage: `radial-gradient(circle at ${mouseX}px ${mouseY}px, transparent 0px, transparent ${radiusPx - blurPx}px, black ${radiusPx}px, black 100%)`,
      WebkitMaskImage: `radial-gradient(circle at ${mouseX}px ${mouseY}px, transparent 0px, transparent ${radiusPx - blurPx}px, black ${radiusPx}px, black 100%)`
    }
  } else {
    maskStyle.value = {}
  }
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

/* ─────────────────────────── mode switching ───────────────────────── */
watch(() => props.mode, (newMode) => {
  if (!model) return

  switch (newMode) {
    case 'normal':
      switchToNormalMode()
      break
    case 'glass':
      switchToGlassMode()
      break
  }
})

/* ─────────────────────────── lifecycle ────────────────────────────── */
onMounted(() => { init() })

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', onResize)
  if (renderer) renderer.dispose()
  if (xrayRenderer) xrayRenderer.dispose()

  // Dispose all materials
  normalMaterials.forEach(mat => mat.dispose())
  glassMaterials.forEach(mat => mat.dispose())

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

  if (xrayModel) {
    xrayModel.traverse((child) => {
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
  position: absolute;
  top: 0;
  left: 0;
}

.xray-layer {
  z-index: 1;
}

.normal-layer {
  z-index: 2;
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