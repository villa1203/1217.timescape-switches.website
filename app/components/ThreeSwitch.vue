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
import { ref, onMounted, onUnmounted, watch } from 'vue'

/* ─────────────────────────── props ────────────────────────────────── */
const props = defineProps({
  // 'normal' | 'glass'
  mode: {
    type: String,
    default: 'normal'
  }
})

/* ─────────────────────────── refs & state ─────────────────────────── */
const canvasRef = ref(null)
const loading = ref(true)

/* ─────────────────────────── three.js state ───────────────────────── */
let THREE, GLTFLoader, scene, camera, renderer, model, animId, canvas
let composer, renderTarget1, renderTarget2
let normalScene, xrayScene, compositingMesh, orthoCamera, orthoScene
let isDragging = false, lastMouse = { x: 0, y: 0 }
let rotVel = { x: 0, y: 0 }, autoRotate = true, autoRotateTimer = null
let spherical = { theta: 0, phi: Math.PI / 2, radius: 5 }
let modelSize = 1
let minZoom = 0.5
let maxZoom = 2
let mousePos = { x: 0.5, y: 0.5 }
let mouseVel = { x: 0, y: 0 }

/* ─────────────────────────── fluid simulation ─────────────────────── */
let fluidCanvas, fluidCtx
let fluidTexture
let prevMousePos = { x: 0.5, y: 0.5 }
const fluidTrail = []
const maxTrailLength = 12
let animTime = 0  // For organic edge animation

/* ─────────────────────────── material storage ─────────────────────── */
let normalMaterials = new Map()
let xrayMaterials = new Map()
let glassMaterials = new Map()

/* ─────────────────────────── custom shaders ───────────────────────── */
const xrayVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const xrayFragmentShader = `
uniform vec3 glowColor;
uniform float glowIntensity;
uniform float fresnelPower;
uniform vec3 cameraPosition;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
  // Fresnel effect for glass-like edge glow
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), fresnelPower);

  // Create inner glow
  vec3 color = glowColor * glowIntensity * fresnel;

  // Add subtle transparency based on viewing angle
  float alpha = fresnel * 0.6 + 0.2;

  gl_FragColor = vec4(color, alpha);
}
`

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

/* ─────────────────────────── material management ───────────────────── */
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
  model.traverse((child) => {
    if (child.isMesh) {
      if (!glassMaterials.has(child)) {
        const originalMat = normalMaterials.get(child)
        const isBlackPart = originalMat && originalMat.color.getHex() === 0x000000

        const purpleColor = 0x8210c1
        const glassMat = new THREE.MeshStandardMaterial({
          color: isBlackPart ? purpleColor : 0xe0e0e0,
          metalness: 0.0,
          roughness: 0.7,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
          emissive: isBlackPart ? purpleColor : 0x000000,
          emissiveIntensity: isBlackPart ? 0.8 : 0
        })

        glassMaterials.set(child, glassMat)
      }
      child.material = glassMaterials.get(child)
    }
  })
}

/* ─────────────────────────── init ────────────────────────────────── */
async function init() {
  THREE = await import('three').then(m => m.default ?? m)
  const { GLTFLoader: Loader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  const { EffectComposer } = await import('three/examples/jsm/postprocessing/EffectComposer.js')
  const { RenderPass } = await import('three/examples/jsm/postprocessing/RenderPass.js')
  const { ShaderPass } = await import('three/examples/jsm/postprocessing/ShaderPass.js')

  GLTFLoader = Loader

  canvas = canvasRef.value
  const W = canvas.clientWidth || canvas.offsetWidth || window.innerWidth
  const H = canvas.clientHeight || canvas.offsetHeight || window.innerHeight

  /* Camera */
  camera = new THREE.PerspectiveCamera(75, W / H, 0.1, 200)
  updateCameraPosition()

  /* Renderer with enhanced settings */
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  })
  // Use full device pixel ratio for better quality
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(W, H, false)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.3  // Moderate brightness

  /* Create render targets for dual-scene rendering with higher MSAA and resolution */
  const targetW = W * window.devicePixelRatio
  const targetH = H * window.devicePixelRatio

  renderTarget1 = new THREE.WebGLRenderTarget(targetW, targetH, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    samples: 8  // Increased anti-aliasing
  })

  renderTarget2 = new THREE.WebGLRenderTarget(targetW, targetH, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    samples: 8  // Increased anti-aliasing
  })

  /* Normal Scene */
  normalScene = new THREE.Scene()
  normalScene.background = new THREE.Color(0xffffff)

  /* X-ray Scene */
  xrayScene = new THREE.Scene()
  xrayScene.background = new THREE.Color(0xffffff)

  /* Enhanced lighting setup */
  function addLights(targetScene, intensity = 1.0) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0 * intensity)
    targetScene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5 * intensity)
    keyLight.position.set(5, 8, 10)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.width = 4096
    keyLight.shadow.mapSize.height = 4096
    keyLight.shadow.camera.near = 0.5
    keyLight.shadow.camera.far = 50
    keyLight.shadow.bias = -0.00001
    targetScene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.5 * intensity)
    fillLight.position.set(-8, 4, 6)
    targetScene.add(fillLight)

    const rightLight = new THREE.DirectionalLight(0xffffff, 1.5 * intensity)
    rightLight.position.set(8, 4, 6)
    targetScene.add(rightLight)

    const rimLight = new THREE.DirectionalLight(0xaaaaff, 0.8 * intensity)
    rimLight.position.set(0, 2, -10)
    targetScene.add(rimLight)
  }

  addLights(normalScene, 1.0)
  addLights(xrayScene, 1.0)

  /* Load GLB model */
  const loader = new GLTFLoader()
  loader.load(
    '/interrupteur.glb',
    (gltf) => {
      model = gltf.scene

      // Calculate part sizes (matches ThreeSceneAdvanced logic)
      const partSizes = new Map()
      model.traverse((child) => {
        if (child.isMesh) {
          const box = new THREE.Box3().setFromObject(child)
          const size = box.getSize(new THREE.Vector3())
          const volume = size.x * size.y * size.z
          partSizes.set(child, volume)
        }
      })

      const volumes = Array.from(partSizes.values()).sort((a, b) => a - b)
      const smallThreshold = volumes[Math.floor(volumes.length * 0.3)]

      const tinyColors = [
        0x000000, 0x00ff00, 0xffffff, 0xffffff,
        0xffffff, 0xffffff, 0xffffff, 0xa8d8ea,
      ]
      let colorIndex = 0

      // Create materials for normal scene (exact ThreeSceneAdvanced logic)
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

          if (volume <= smallThreshold) {
            normalMaterial = new THREE.MeshStandardMaterial({
              color: tinyColors[colorIndex % tinyColors.length],
              metalness: 0.1,
              roughness: 0.3,
              side: THREE.DoubleSide,
              envMapIntensity: 1.0
            })
            colorIndex++
          } else if (originalMat.metalness === 1) {
            normalMaterial = new THREE.MeshStandardMaterial({
              color: 0x000000,
              metalness: 0.2,
              roughness: 0.4,
              side: THREE.DoubleSide,
            })
          } else {
            normalMaterial = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0.0,
              roughness: 0.35,
              side: THREE.DoubleSide,
            })
          }

          child.material = normalMaterial
          normalMaterials.set(child, normalMaterial)
        }
      })

      // Clone model for X-ray scene
      const xrayModel = model.clone()

      // Create parallel arrays for matching meshes
      const normalMeshes = []
      const xrayMeshes = []

      model.traverse((child) => {
        if (child.isMesh) normalMeshes.push(child)
      })

      xrayModel.traverse((child) => {
        if (child.isMesh) xrayMeshes.push(child)
      })

      // Create frosted glass X-ray materials
      xrayMeshes.forEach((child, index) => {
        child.castShadow = true
        child.receiveShadow = true

        if (child.geometry) {
          child.geometry.computeVertexNormals()
        }

        // Get corresponding normal material by index
        const normalMesh = normalMeshes[index]
        const normalMaterial = normalMaterials.get(normalMesh)
        const isBlackPart = normalMaterial && normalMaterial.color.getHex() === 0x000000

        // Create frosted glass material with emissive glow for purple parts
        const purpleColor = 0x8210c1
        const xrayMat = new THREE.MeshStandardMaterial({
          color: isBlackPart ? purpleColor : 0xe0e0e0,  // Purple for black parts, gray for rest
          metalness: 0.0,
          roughness: 0.7,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
          emissive: isBlackPart ? purpleColor : 0x000000,  // Glowing purple for black parts
          emissiveIntensity: isBlackPart ? 0.8 : 0.0
        })

        child.material = xrayMat
        xrayMaterials.set(child, xrayMat)
      })

      // Center models
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center)
      xrayModel.position.sub(center)

      const size = box.getSize(new THREE.Vector3())
      modelSize = Math.max(size.x, size.y, size.z)

      spherical.radius = modelSize * 2
      minZoom = modelSize * 1.2
      maxZoom = modelSize * 4

      updateCameraPosition()

      // Add to scenes
      normalScene.add(model)
      xrayScene.add(xrayModel)

      loading.value = false

      // Initialize fluid simulation canvas
      initFluidSimulation()

      animate()
    },
    undefined,
    (error) => {
      console.error('Error loading GLB:', error)
      loading.value = false
    }
  )

  // Event listeners
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
  // Create offscreen canvas for fluid simulation with higher resolution
  // Match canvas aspect ratio to avoid elliptical distortion
  const aspectRatio = canvas.width / canvas.height
  const baseRes = 1024  // Higher resolution for better anti-aliasing

  fluidCanvas = document.createElement('canvas')
  if (aspectRatio >= 1) {
    fluidCanvas.width = baseRes
    fluidCanvas.height = baseRes / aspectRatio
  } else {
    fluidCanvas.width = baseRes * aspectRatio
    fluidCanvas.height = baseRes
  }
  fluidCtx = fluidCanvas.getContext('2d')

  // Create texture from fluid canvas
  fluidTexture = new THREE.CanvasTexture(fluidCanvas)
  fluidTexture.minFilter = THREE.LinearFilter
  fluidTexture.magFilter = THREE.LinearFilter
}

// Simple noise function for organic edge animation
function noise2D(x, y) {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

function updateFluidSimulation() {
  if (!fluidCtx) return

  // Increment animation time very slowly - like clouds drifting
  animTime += 0.003

  // Fade out previous frame (diffusion effect)
  fluidCtx.fillStyle = 'rgba(0, 0, 0, 0.08)'
  fluidCtx.fillRect(0, 0, fluidCanvas.width, fluidCanvas.height)

  // Add mouse trail to fluid
  fluidTrail.push({ x: mousePos.x, y: mousePos.y })
  if (fluidTrail.length > maxTrailLength) {
    fluidTrail.shift()
  }

  // Draw fluid trail with gentle wave-like edges
  fluidTrail.forEach((point, i) => {
    const progress = i / maxTrailLength
    const baseSize = progress * 35 + 12 // Base size (12-47px)
    const alpha = progress // Fade in along trail

    const time = animTime

    // Create gentle wave motion using simple sine waves
    // Use lower frequencies for slower, larger waves
    const wave1 = Math.sin(point.x * Math.PI * 2 + time * 2) * 0.015
    const wave2 = Math.cos(point.y * Math.PI * 2 + time * 2) * 0.015
    const wave3 = Math.sin((point.x + point.y) * Math.PI + time * 1.5) * 0.01

    // Combine waves for gentle flowing effect
    const flowX = wave1 + wave3
    const flowY = wave2 + wave3

    // Very gentle size variation - like gentle breathing
    const sizeWave = Math.sin(time * 2 + i * 0.5) * 0.08
    const size = baseSize * (1 + sizeWave)

    const centerX = (point.x + flowX) * fluidCanvas.width
    const centerY = (1.0 - point.y + flowY) * fluidCanvas.height

    const gradient = fluidCtx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, size
    )

    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`)
    gradient.addColorStop(0.65, `rgba(255, 255, 255, ${alpha * 0.3})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    fluidCtx.fillStyle = gradient
    fluidCtx.fillRect(0, 0, fluidCanvas.width, fluidCanvas.height)
  })

  // Update texture
  if (fluidTexture) {
    fluidTexture.needsUpdate = true
  }

  // Track velocity for fluid momentum
  prevMousePos.x = mousePos.x
  prevMousePos.y = mousePos.y
}

/* ─────────────────────────── animate ──────────────────────────────── */
function animate() {
  animId = requestAnimationFrame(animate)

  // Update camera uniforms for X-ray shaders
  xrayMaterials.forEach((mat) => {
    if (mat.uniforms) {
      mat.uniforms.cameraPosition.value.copy(camera.position)
    }
  })

  // Auto-rotate
  if (autoRotate) {
    spherical.theta += 0.002
    updateCameraPosition()
  }

  // Apply rotation velocity
  if (Math.abs(rotVel.x) > 0.001 || Math.abs(rotVel.y) > 0.001) {
    spherical.theta += rotVel.x
    spherical.phi += rotVel.y
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))
    rotVel.x *= 0.92
    rotVel.y *= 0.92
    updateCameraPosition()
  }

  // Smooth mouse velocity for fluid effect
  mouseVel.x *= 0.95
  mouseVel.y *= 0.95

  // Update fluid simulation
  updateFluidSimulation()

  // Render based on mode
  if (props.mode === 'normal') {
    // Render normal scene to texture
    renderer.setRenderTarget(renderTarget1)
    renderer.render(normalScene, camera)

    // Render X-ray scene to texture
    renderer.setRenderTarget(renderTarget2)
    renderer.render(xrayScene, camera)

    // Composite to screen with custom shader
    renderer.setRenderTarget(null)

    // Create full-screen quad for compositing
    if (!compositingMesh) {
      const geometry = new THREE.PlaneGeometry(2, 2)
      const material = new THREE.ShaderMaterial({
        vertexShader: compositingVertexShader,
        fragmentShader: compositingFragmentShader,
        uniforms: {
          normalTexture: { value: renderTarget1.texture },
          xrayTexture: { value: renderTarget2.texture },
          fluidTexture: { value: fluidTexture },
          mousePosition: { value: new THREE.Vector2(mousePos.x, mousePos.y) },
          revealRadius: { value: 0.08 },
          revealSoftness: { value: 0.04 },
          resolution: { value: new THREE.Vector2(canvas.width, canvas.height) },
          useFluid: { value: true }
        }
      })
      compositingMesh = new THREE.Mesh(geometry, material)

      orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
      orthoScene = new THREE.Scene()
      orthoScene.add(compositingMesh)
    }

    // Update uniforms
    compositingMesh.material.uniforms.mousePosition.value.set(mousePos.x, mousePos.y)
    if (fluidTexture) {
      compositingMesh.material.uniforms.fluidTexture.value = fluidTexture
    }

    // Render composite
    renderer.render(orthoScene, orthoCamera)
  } else {
    // Glass mode - just render normal scene
    renderer.setRenderTarget(null)
    renderer.render(normalScene, camera)
  }
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

  // Update render targets with device pixel ratio for high-quality rendering
  const targetW = W * window.devicePixelRatio
  const targetH = H * window.devicePixelRatio

  if (renderTarget1) {
    renderTarget1.setSize(targetW, targetH)
    renderTarget2.setSize(targetW, targetH)
  }

  if (compositingMesh) {
    compositingMesh.material.uniforms.resolution.value.set(targetW, targetH)
  }

  // Re-initialize fluid canvas with new aspect ratio
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

    if (fluidTexture) {
      fluidTexture.needsUpdate = true
    }
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
  // Handle rotation
  if (isDragging) {
    const dx = e.clientX - lastMouse.x
    const dy = e.clientY - lastMouse.y
    rotVel.x = dx * 0.008
    rotVel.y = dy * 0.008
    lastMouse = { x: e.clientX, y: e.clientY }
  }

  // Update mouse position for X-ray effect
  const moveCanvas = canvasRef.value
  if (moveCanvas) {
    const rect = moveCanvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = 1.0 - (e.clientY - rect.top) / rect.height // Flip Y

    // Smooth mouse movement
    mousePos.x += (x - mousePos.x) * 0.15
    mousePos.y += (y - mousePos.y) * 0.15

    // Track velocity
    mouseVel.x = x - mousePos.x
    mouseVel.y = y - mousePos.y
  }
}

function onMouseUp() {
  isDragging = false
  autoRotateTimer = setTimeout(() => { autoRotate = true }, 2500)
}

function onWheel(e) {
  e.preventDefault()
  const delta = e.deltaY * 0.001
  spherical.radius += delta * modelSize
  spherical.radius = Math.max(minZoom, Math.min(maxZoom, spherical.radius))
  updateCameraPosition()
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
</style>
