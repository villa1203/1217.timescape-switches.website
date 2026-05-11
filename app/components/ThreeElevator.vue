<template>
  <div class="scene-wrapper">
    <canvas ref="canvasRef" class="scene-canvas" />

    <!-- Loading state -->
    <Transition name="fade">
      <div v-if="loading" class="scene-loader">
        <div class="loader-ring" />
      </div>
    </Transition>

    <!-- Dev-only perf HUD -->
    <div v-if="isDev" class="perf-hud">{{ fps }}fps {{ frameMs }}ms</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useFrameStats } from '~/composables/useFrameStats'

/* ─────────────────────────── props ────────────────────────────────── */
const isDev = import.meta.env.DEV
const { fps, frameMs } = isDev ? useFrameStats() : { fps: { value: 0 }, frameMs: { value: 0 } }

const props = defineProps({
  mode: { type: String, default: 'normal' },  // 'normal' | 'glass'
  paused: { type: Boolean, default: false }
})

/* ─────────────────────────── colours ──────────────────────────────── */
// Edit these hex values to quickly update all material colours.
const PURPLE             = 0xBB55FF  // xray glow — highlighted parts
const XRAY_BODY          = 0xe0e0e0  // xray — all non-highlighted parts (transparent grey)
const NORMAL_METAL       = 0xffffff  // normal — metallic finish (most parts)
const NORMAL_METAL_HILIT = 0xe8e8e8  // normal — metallic finish for highlighted parts (slight grey)

/* ─────────────────────────── part assignments ─────────────────────── */
// Mesh indices from the console.log below. Uncomment the log, open DevTools,
// then hardcode the values here.
const purpleParts = [11, 12, 28, 29, 30, 31, 32]  // NORMAL_METAL_HILIT in normal mode, glow PURPLE in xray mode
// All other parts use NORMAL_METAL in normal mode and XRAY_BODY in xray mode.

/* ─────────────────────────── camera ───────────────────────────────── */
const CAMERA_DISTANCE = 1.2  // × modelSize — decrease to start closer, increase to zoom out

/* ─────────────────────────── refs & state ─────────────────────────── */
const canvasRef = ref(null)
const loading = ref(true)

/* ─────────────────────────── three.js state ───────────────────────── */
let THREE, GLTFLoader, camera, renderer, model, animId, canvas
let renderTarget1, renderTarget2
let normalScene, xrayScene, compositingMesh, orthoCamera, orthoScene
let isDragging = false, lastMouse = { x: 0, y: 0 }
let rotVel = { x: 0, y: 0 }, autoRotate = true, autoRotateTimer = null
let spherical = { theta: 0, phi: Math.PI / 2, radius: 5 }
let modelSize = 1, minZoom = 0.5, maxZoom = 2
let mousePos = { x: 0.5, y: 0.5 }

/* ─────────────────────────── fluid simulation state ───────────────── */
let fluidCanvas, fluidCtx, fluidTexture
const fluidTrail = []
const maxTrailLength = 12
let animTime = 0
let renderRequested = false
let fluidDecayFrames = 0

/* ─────────────────────────── material storage ─────────────────────── */
let normalMaterials = new Map()
let xrayMaterials = new Map()
let glassMaterials = new Map()

/* ─────────────────────────── shaders ──────────────────────────────── */
const compositingFragmentShader = `
uniform sampler2D normalTexture;
uniform sampler2D xrayTexture;
uniform sampler2D fluidTexture;
uniform vec2 mousePosition;
uniform float revealRadius;
uniform float revealSoftness;
uniform vec2 resolution;
uniform bool useFluid;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;

  float mask;

  if (useFluid) {
    // Use fluid simulation for organic reveal
    vec4 fluidColor = texture2D(fluidTexture, uv);
    mask = fluidColor.r; // Use red channel as mask
  } else {
    // Fallback to simple circular mask
    vec2 pixelPos = uv * resolution;
    vec2 mousePixelPos = mousePosition * resolution;
    float dist = length(pixelPos - mousePixelPos);

    float radiusPx = min(resolution.x, resolution.y) * revealRadius;
    float softnessPx = min(resolution.x, resolution.y) * revealSoftness;

    mask = 1.0 - smoothstep(radiusPx - softnessPx, radiusPx, dist);
  }

  // Sample both textures
  vec4 normalColor = texture2D(normalTexture, uv);
  vec4 xrayColor = texture2D(xrayTexture, uv);

  // Mix based on mask - when mask=1 show xray, when mask=0 show normal
  vec4 finalColor = mix(normalColor, xrayColor, mask);

  gl_FragColor = finalColor;
}
`

const compositingVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/* ─────────────────────────── material mode switching ──────────────── */
function switchToNormalMode() {
  if (!model) return
  model.traverse((child) => {
    if (child.isMesh && normalMaterials.has(child)) {
      child.material = normalMaterials.get(child)
    }
  })
}

function switchToGlassMode() {
  if (!model) return

  const meshes = []
  model.traverse((c) => { if (c.isMesh) meshes.push(c) })

  model.traverse((child) => {
    if (child.isMesh) {
      if (!glassMaterials.has(child)) {
        const isPurple = purpleParts.includes(meshes.indexOf(child))
        const glassMat = new THREE.MeshStandardMaterial({
          color: isPurple ? PURPLE : XRAY_BODY,
          metalness: 0.0,
          roughness: 0.7,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
          emissive: 0x000000,
          emissiveIntensity: 0
        })
        glassMaterials.set(child, glassMat)
      }
      child.material = glassMaterials.get(child)
    }
  })
}

/* ─────────────────────────── init ─────────────────────────────────── */
async function init() {
  THREE = await import('three').then(m => m.default ?? m)
  const { GLTFLoader: Loader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  GLTFLoader = Loader

  canvas = canvasRef.value
  const W = canvas.clientWidth || canvas.offsetWidth || window.innerWidth
  const H = canvas.clientHeight || canvas.offsetHeight || window.innerHeight

  /* Camera */
  camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 200)
  updateCameraPosition()

  /* Renderer */
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(W, H, false)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.3

  /* Render targets for dual-scene compositing */
  const targetW = W * Math.min(window.devicePixelRatio, 2)
  const targetH = H * Math.min(window.devicePixelRatio, 2)

  renderTarget1 = new THREE.WebGLRenderTarget(targetW, targetH, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    samples: 4
  })

  renderTarget2 = new THREE.WebGLRenderTarget(targetW, targetH, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    samples: 4
  })

  /* Environment map — neutral white for clean metallic reflections */
  const pmremGenerator = new THREE.PMREMGenerator(renderer)
  pmremGenerator.compileEquirectangularShader()

  const envScene = new THREE.Scene()
  envScene.background = new THREE.Color(0xffffff)
  envScene.add(new THREE.AmbientLight(0xffffff, 3.0))

  const cubeRenderTarget = pmremGenerator.fromScene(envScene)
  const envMap = cubeRenderTarget.texture
  pmremGenerator.dispose()

  /* Normal Scene */
  normalScene = new THREE.Scene()
  normalScene.background = new THREE.Color(0xffffff)

  /* X-ray Scene */
  xrayScene = new THREE.Scene()
  xrayScene.background = new THREE.Color(0xffffff)

  /* Lighting */
  function addLights(targetScene, intensity = 1.0, enableShadows = true) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2 * intensity)
    targetScene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5 * intensity)
    keyLight.position.set(5, 8, 10)
    keyLight.castShadow = enableShadows
    if (enableShadows) {
      keyLight.shadow.mapSize.width = 1024
      keyLight.shadow.mapSize.height = 1024
      keyLight.shadow.camera.near = 0.5
      keyLight.shadow.camera.far = 50
      keyLight.shadow.bias = -0.00001
    }
    targetScene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5 * intensity)
    fillLight.position.set(-8, 4, 6)
    targetScene.add(fillLight)

    const rightLight = new THREE.DirectionalLight(0xffffff, 1.5 * intensity)
    rightLight.position.set(8, 4, 6)
    targetScene.add(rightLight)

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8 * intensity)
    rimLight.position.set(0, 2, -10)
    targetScene.add(rimLight)
  }

  addLights(normalScene, 1.0)
  addLights(xrayScene,   1.0, false)

  /* Load GLB model */
  const loader = new GLTFLoader()
  loader.load(
    '/elevator.glb',
    (gltf) => {
      model = gltf.scene

      const normalMeshes = []
      model.traverse((c) => { if (c.isMesh) normalMeshes.push(c) })

      // console.log('ThreeElevator meshes:')
      // normalMeshes.forEach((c, i) => console.log(`  [${i}] name="${c.name}" parent="${c.parent?.name}"`))
      // console.log('ThreeElevator part assignments:', { purpleParts })

      /* Normal scene materials — metallic with env map reflections */
      normalMeshes.forEach((child, i) => {
        child.castShadow = true
        child.receiveShadow = true
        if (child.geometry) child.geometry.computeVertexNormals()

        const isPurple = purpleParts.includes(i)
        const mat = new THREE.MeshStandardMaterial({
          color: isPurple ? NORMAL_METAL_HILIT : NORMAL_METAL,
          metalness: 0.85,
          roughness: isPurple ? 0.25 : 0.15,
          side: THREE.DoubleSide,
          envMap: envMap,
          envMapIntensity: 0.4
        })

        child.material = mat
        normalMaterials.set(child, mat)
      })

      /* X-ray scene — clone and apply transparent materials */
      const xrayModel = model.clone()
      const xrayMeshes = []
      xrayModel.traverse((c) => { if (c.isMesh) xrayMeshes.push(c) })

      xrayMeshes.forEach((child, i) => {
        child.castShadow = true
        child.receiveShadow = true
        if (child.geometry) child.geometry.computeVertexNormals()

        const isPurple = purpleParts.includes(i)
        const mat = new THREE.MeshStandardMaterial({
          color: isPurple ? PURPLE : XRAY_BODY,
          metalness: 0.0,
          roughness: 0.85,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          depthWrite: false,
          emissive: 0x000000,
          emissiveIntensity: 0
        })

        child.material = mat
        xrayMaterials.set(child, mat)
      })

      /* Center models */
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)
      xrayModel.position.sub(center)

      const size = box.getSize(new THREE.Vector3())
      modelSize = Math.max(size.x, size.y, size.z)
      spherical.radius = modelSize * CAMERA_DISTANCE
      minZoom = modelSize * 1.2
      maxZoom = modelSize * 4
      updateCameraPosition()

      normalScene.add(model)
      xrayScene.add(xrayModel)
      loading.value = false
      initFluidSimulation()
      requestRender()
    },
    undefined,
    (error) => {
      console.error('Error loading GLB:', error)
      loading.value = false
    }
  )

  /* Event listeners */
  window.addEventListener('resize', onResize)
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('mouseleave', onMouseUp)
  canvas.addEventListener('wheel', onWheel, { passive: false })
  canvas.addEventListener('touchstart', onTouchStart, { passive: false })
  canvas.addEventListener('touchmove', onTouchMove, { passive: false })
  canvas.addEventListener('touchend', onMouseUp)
}

/* ─────────────────────────── camera ───────────────────────────────── */
function updateCameraPosition() {
  if (!camera) return
  const { theta, phi, radius } = spherical
  camera.position.x = radius * Math.sin(phi) * Math.cos(theta)
  camera.position.y = radius * Math.cos(phi)
  camera.position.z = radius * Math.sin(phi) * Math.sin(theta)
  camera.lookAt(0, 0, 0)
}

/* ─────────────────────────── fluid simulation ─────────────────────── */
function initFluidSimulation() {
  const aspectRatio = canvas.width / canvas.height
  const baseRes = 1024

  fluidCanvas = document.createElement('canvas')
  if (aspectRatio >= 1) {
    fluidCanvas.width = baseRes
    fluidCanvas.height = baseRes / aspectRatio
  } else {
    fluidCanvas.width = baseRes * aspectRatio
    fluidCanvas.height = baseRes
  }
  fluidCtx = fluidCanvas.getContext('2d')

  fluidTexture = new THREE.CanvasTexture(fluidCanvas)
  fluidTexture.minFilter = THREE.LinearFilter
  fluidTexture.magFilter = THREE.LinearFilter
}

function updateFluidSimulation() {
  if (!fluidCtx) return

  animTime += 0.003

  fluidCtx.fillStyle = 'rgba(0, 0, 0, 0.08)'
  fluidCtx.fillRect(0, 0, fluidCanvas.width, fluidCanvas.height)

  fluidTrail.push({ x: mousePos.x, y: mousePos.y })
  if (fluidTrail.length > maxTrailLength) fluidTrail.shift()

  fluidTrail.forEach((point, i) => {
    const progress = i / maxTrailLength
    const baseSize = progress * 35 + 12
    const alpha = progress
    const time = animTime

    const wave1 = Math.sin(point.x * Math.PI * 2 + time * 2) * 0.015
    const wave2 = Math.cos(point.y * Math.PI * 2 + time * 2) * 0.015
    const wave3 = Math.sin((point.x + point.y) * Math.PI + time * 1.5) * 0.01
    const flowX = wave1 + wave3
    const flowY = wave2 + wave3

    const sizeWave = Math.sin(time * 2 + i * 0.5) * 0.08
    const size = baseSize * (1 + sizeWave)

    const centerX = (point.x + flowX) * fluidCanvas.width
    const centerY = (1.0 - point.y + flowY) * fluidCanvas.height

    const gradient = fluidCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size)
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`)
    gradient.addColorStop(0.65, `rgba(255, 255, 255, ${alpha * 0.3})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    fluidCtx.fillStyle = gradient
    fluidCtx.fillRect(0, 0, fluidCanvas.width, fluidCanvas.height)
  })

  if (fluidTexture) fluidTexture.needsUpdate = true
}

/* ─────────────────────────── animate ──────────────────────────────── */
function requestRender() {
  if (props.paused || renderRequested) return
  renderRequested = true
  animId = requestAnimationFrame(animate)
}

function animate() {
  renderRequested = false
  if (fluidDecayFrames > 0) fluidDecayFrames--

  if (autoRotate) {
    spherical.theta += 0.002
    updateCameraPosition()
  }

  if (Math.abs(rotVel.x) > 0.001 || Math.abs(rotVel.y) > 0.001) {
    spherical.theta += rotVel.x
    spherical.phi += rotVel.y
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))
    rotVel.x *= 0.92
    rotVel.y *= 0.92
    updateCameraPosition()
  }

  updateFluidSimulation()

  if (props.mode === 'normal') {
    renderer.setRenderTarget(renderTarget1)
    renderer.render(normalScene, camera)

    renderer.setRenderTarget(renderTarget2)
    renderer.render(xrayScene, camera)

    renderer.setRenderTarget(null)

    if (!compositingMesh) {
      const geometry = new THREE.PlaneGeometry(2, 2)
      const material = new THREE.ShaderMaterial({
        vertexShader: compositingVertexShader,
        fragmentShader: compositingFragmentShader,
        uniforms: {
          normalTexture: { value: renderTarget1.texture },
          xrayTexture:   { value: renderTarget2.texture },
          fluidTexture:  { value: fluidTexture },
          mousePosition: { value: new THREE.Vector2(mousePos.x, mousePos.y) },
          revealRadius:  { value: 0.08 },
          revealSoftness:{ value: 0.04 },
          resolution:    { value: new THREE.Vector2(canvas.width, canvas.height) },
          useFluid:      { value: true }
        }
      })
      compositingMesh = new THREE.Mesh(geometry, material)
      orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
      orthoScene = new THREE.Scene()
      orthoScene.add(compositingMesh)
    }

    compositingMesh.material.uniforms.mousePosition.value.set(mousePos.x, mousePos.y)
    if (fluidTexture) compositingMesh.material.uniforms.fluidTexture.value = fluidTexture

    renderer.render(orthoScene, orthoCamera)
  } else {
    renderer.setRenderTarget(null)
    renderer.render(normalScene, camera)
  }

  const needsLoop = autoRotate
    || Math.abs(rotVel.x) > 0.001
    || Math.abs(rotVel.y) > 0.001
    || fluidDecayFrames > 0
  if (needsLoop) requestRender()
}

/* ─────────────────────────── resize ───────────────────────────────── */
function onResize() {
  const resizeCanvas = canvasRef.value
  if (!resizeCanvas) return
  const W = resizeCanvas.clientWidth
  const H = resizeCanvas.clientHeight
  camera.aspect = W / H
  camera.updateProjectionMatrix()
  renderer.setSize(W, H, false)

  const targetW = W * Math.min(window.devicePixelRatio, 2)
  const targetH = H * Math.min(window.devicePixelRatio, 2)

  if (renderTarget1) {
    renderTarget1.setSize(targetW, targetH)
    renderTarget2.setSize(targetW, targetH)
  }

  if (compositingMesh) {
    compositingMesh.material.uniforms.resolution.value.set(targetW, targetH)
  }

  if (fluidCanvas) {
    const aspectRatio = W / H
    const baseRes = 1024
    if (aspectRatio >= 1) {
      fluidCanvas.width = baseRes
      fluidCanvas.height = baseRes / aspectRatio
    } else {
      fluidCanvas.width = baseRes * aspectRatio
      fluidCanvas.height = baseRes
    }
    if (fluidTexture) fluidTexture.needsUpdate = true
  }
  requestRender()
}

/* ─────────────────────────── mouse / touch ────────────────────────── */
function onMouseDown(e) {
  isDragging = true
  autoRotate = false
  clearTimeout(autoRotateTimer)
  lastMouse = { x: e.clientX, y: e.clientY }
}

function onMouseMove(e) {
  fluidDecayFrames = 40
  requestRender()
  if (isDragging) {
    const dx = e.clientX - lastMouse.x
    const dy = e.clientY - lastMouse.y
    rotVel.x = dx * 0.008
    rotVel.y = dy * 0.008
    lastMouse = { x: e.clientX, y: e.clientY }
  }

  const moveCanvas = canvasRef.value
  if (moveCanvas) {
    const rect = moveCanvas.getBoundingClientRect()
    mousePos.x += ((e.clientX - rect.left) / rect.width - mousePos.x) * 0.15
    mousePos.y += (1.0 - (e.clientY - rect.top) / rect.height - mousePos.y) * 0.15
  }
}

function onMouseUp() {
  isDragging = false
  autoRotateTimer = setTimeout(() => { autoRotate = true; requestRender() }, 2500)
}

function onWheel(e) {
  e.preventDefault()
  spherical.radius += e.deltaY * 0.001 * modelSize
  spherical.radius = Math.max(minZoom, Math.min(maxZoom, spherical.radius))
  updateCameraPosition()
  requestRender()
}

let touchStart = null
function onTouchStart(e) {
  e.preventDefault()
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
  if (newMode === 'normal') switchToNormalMode()
  else if (newMode === 'glass') switchToGlassMode()
})

watch(() => props.paused, (isPaused) => {
  if (isPaused) {
    cancelAnimationFrame(animId)
    animId = 0
    renderRequested = false
    fluidDecayFrames = 0
    fluidTrail.length = 0
  } else if (renderer) {
    requestRender()
  }
})

/* ─────────────────────────── lifecycle ────────────────────────────── */
onMounted(() => { init() })

onUnmounted(() => {
  cancelAnimationFrame(animId)
  window.removeEventListener('resize', onResize)
  if (renderer) {
    renderer.dispose()
    if (renderTarget1) renderTarget1.dispose()
    if (renderTarget2) renderTarget2.dispose()
  }

  normalMaterials.forEach(mat => mat.dispose())
  xrayMaterials.forEach(mat => mat.dispose())
  glassMaterials.forEach(mat => mat.dispose())

  if (model) {
    model.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
  }
})
</script>

<style scoped>
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
  width: 64px;
  height: 64px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #8210c1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.perf-hud {
  position: absolute;
  top: 6px;
  left: 6px;
  font: 11px/1 monospace;
  color: #00ff88;
  background: rgba(0,0,0,0.55);
  padding: 3px 6px;
  border-radius: 3px;
  pointer-events: none;
  z-index: 100;
  user-select: none;
}
</style>
