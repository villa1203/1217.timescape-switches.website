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
    <!-- <div v-if="isDev" class="perf-hud">{{ fps }}fps {{ frameMs }}ms</div> -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
// import { useFrameStats } from '~/composables/useFrameStats'

// const isDev = import.meta.env.DEV
// const { fps, frameMs } = isDev ? useFrameStats() : { fps: { value: 0 }, frameMs: { value: 0 } }

/* ─────────────────────────── props ────────────────────────────────── */
const props = defineProps({
  mode: { type: String, default: 'normal' },  // 'normal' | 'glass'
  paused: { type: Boolean, default: false },
  // GLB URL from the CMS (page.model). Falls back to the bundled /public asset
  // when the CMS has no model uploaded for this object.
  src: { type: String, default: '' }
})

/* ─────────────────────────── colours ──────────────────────────────── */
// Edit these hex values to quickly update all material colours.
const PURPLE       = 0xBB55FF  // xray glow — highlighted parts (blackParts in xray)
const XRAY_BODY    = 0xe0e0e0  // xray — all non-highlighted parts (transparent grey)
const NORMAL_WHITE = 0xffffff  // normal — white plastic body
const NORMAL_BLACK = 0x000000  // normal — black parts
const NORMAL_GREEN = 0x00ff00  // normal — green LED indicator

/* ─────────────────────────── part assignments ─────────────────────── */
// Parts are assigned dynamically by volume when USE_DYNAMIC_ASSIGNMENT is true.
// Set it to false to use the hardcoded arrays below (faster, no recomputation).
// The console.log below shows the result of dynamic assignment — copy those
// values here when you want to hardcode them.
const USE_DYNAMIC_ASSIGNMENT = true

let blackParts         = [0]                              // black in normal, glow PURPLE in xray
let blackPartsMetallic = []                              // subset of blackParts with a metallic finish
let greenParts         = [1]                              // green LED
let whiteParts         = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]  // white plastic (everything else)

/* ─────────────────────────── camera ───────────────────────────────── */
const CAMERA_DISTANCE = 2  // × modelSize — decrease to start closer, increase to zoom out

/* ─────────────────────────── refs & state ─────────────────────────── */
const canvasRef = ref(null)
let resizeObserver = null
const loading = ref(true)

/* ─────────────────────────── three.js state ───────────────────────── */
let THREE, GLTFLoader, camera, renderer, model, animId, canvas
let renderTarget1, renderTarget2
let normalScene, xrayScene, compositingMesh, orthoCamera, orthoScene
let isDragging = false, lastMouse = { x: 0, y: 0 }
let pointerInside = false  // cursor over the canvas → feed the x-ray reveal
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
        const isBlack = blackParts.includes(meshes.indexOf(child))
        const glassMat = new THREE.MeshStandardMaterial({
          color: isBlack ? PURPLE : XRAY_BODY,
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
    alpha: true,
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

  /* Normal Scene */
  normalScene = new THREE.Scene()
  normalScene.background = null

  /* X-ray Scene */
  xrayScene = new THREE.Scene()
  xrayScene.background = null

  /* Lighting */
  function addLights(targetScene, intensity = 1.0, enableShadows = true) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0 * intensity)
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

    const rimLight = new THREE.DirectionalLight(0xaaaaff, 0.8 * intensity)
    rimLight.position.set(0, 2, -10)
    targetScene.add(rimLight)
  }

  addLights(normalScene, 1.0)
  addLights(xrayScene,   1.0, false)

  /* Load GLB model */
  const loader = new GLTFLoader()
  loader.load(
    props.src || '/interrupteur.glb',
    (gltf) => {
      model = gltf.scene

      /* Compute bounding-box volumes for size-based part classification */
      const partSizes = new Map()
      model.traverse((child) => {
        if (child.isMesh) {
          const box = new THREE.Box3().setFromObject(child)
          const size = box.getSize(new THREE.Vector3())
          partSizes.set(child, size.x * size.y * size.z)
        }
      })

      const volumes = Array.from(partSizes.values()).sort((a, b) => a - b)
      const smallThreshold = volumes[Math.floor(volumes.length * 0.3)]

      // Small parts cycle through these identification colours
      const tinyColors = [
        0x000000, 0x00ff00, 0xffffff, 0xffffff,
        0xffffff, 0xffffff, 0xffffff, 0xa8d8ea,
      ]
      let colorIndex = 0

      const normalMeshes = []
      model.traverse((c) => { if (c.isMesh) normalMeshes.push(c) })

      if (USE_DYNAMIC_ASSIGNMENT) {
        blackParts         = []
        blackPartsMetallic = []
        greenParts         = []
        whiteParts         = []

        normalMeshes.forEach((child, i) => {
          const volume = partSizes.get(child)

          if (volume <= smallThreshold) {
            const color = tinyColors[colorIndex % tinyColors.length]
            if (color === 0x000000)      blackParts.push(i)
            else if (color === 0x00ff00) greenParts.push(i)
            else                         whiteParts.push(i)
            colorIndex++
          } else if (child.material.metalness === 1) {
            blackParts.push(i)
            blackPartsMetallic.push(i)
          } else {
            whiteParts.push(i)
          }
        })

        // console.log('ThreeSwitch part assignments:')
        // console.log('  blackParts:', blackParts, '// black in normal, glow PURPLE in xray')
        // console.log('  blackPartsMetallic:', blackPartsMetallic, '// subset with metallic finish')
        // console.log('  greenParts:', greenParts, '// green LED')
        // console.log('  whiteParts:', whiteParts, '// white plastic')
      }

      // console.log('ThreeSwitch meshes:')
      // normalMeshes.forEach((c, i) => console.log(`  [${i}] name="${c.name}" parent="${c.parent?.name}"`))

      /* Normal scene materials */
      normalMeshes.forEach((child, i) => {
        child.castShadow = true
        child.receiveShadow = true
        if (child.geometry) child.geometry.computeVertexNormals()

        let mat
        if (blackParts.includes(i)) {
          mat = blackPartsMetallic.includes(i)
            ? new THREE.MeshStandardMaterial({
                color: NORMAL_BLACK,
                metalness: 0.2,
                roughness: 0.4,
                side: THREE.DoubleSide,
              })
            : new THREE.MeshStandardMaterial({
                color: NORMAL_BLACK,
                metalness: 0.1,
                roughness: 0.3,
                side: THREE.DoubleSide,
                envMapIntensity: 1.0
              })
        } else if (greenParts.includes(i)) {
          mat = new THREE.MeshStandardMaterial({
            color: NORMAL_GREEN,
            metalness: 0.1,
            roughness: 0.3,
            side: THREE.DoubleSide,
            envMapIntensity: 1.0
          })
        } else {
          mat = new THREE.MeshStandardMaterial({
            color: NORMAL_WHITE,
            metalness: 0.0,
            roughness: 0.35,
            side: THREE.DoubleSide,
          })
        }

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

        const isBlack = blackParts.includes(i)
        const mat = new THREE.MeshStandardMaterial({
          color: isBlack ? PURPLE : XRAY_BODY,
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
      minZoom = modelSize * 0.8
      maxZoom = modelSize * CAMERA_DISTANCE
      updateCameraPosition()

      normalScene.add(model)
      xrayScene.add(xrayModel)
      loading.value = false
      initFluidSimulation()
      // apply the initial mode — the props.mode watcher only fires on change, not on mount
      if (props.mode === 'glass') switchToGlassMode()
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
  // React to container size changes too (overlay open, layout settling); the
  // window 'resize' alone misses these, leaving camera.aspect wrong → squashed.
  resizeObserver = new ResizeObserver(() => onResize())
  resizeObserver.observe(canvas)
  canvas.addEventListener('mousedown', onMouseDown)
  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('mouseup', onMouseUp)
  canvas.addEventListener('mouseenter', onMouseEnter)
  canvas.addEventListener('mouseleave', onMouseLeave)
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

  // Only feed the trail while hovering; otherwise drain it so the reveal fades
  // out and disappears when there's no hover.
  if (pointerInside) {
    fluidTrail.push({ x: mousePos.x, y: mousePos.y })
    if (fluidTrail.length > maxTrailLength) fluidTrail.shift()
  } else if (fluidTrail.length > 0) {
    fluidTrail.shift()
  }

  fluidTrail.forEach((point, i) => {
    const progress = i / maxTrailLength
    const baseSize = progress * 70 + 26
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
    || fluidTrail.length > 0
  if (needsLoop) requestRender()
}

/* ─────────────────────────── resize ───────────────────────────────── */
function onResize() {
  const resizeCanvas = canvasRef.value
  if (!resizeCanvas) return
  const W = resizeCanvas.clientWidth
  const H = resizeCanvas.clientHeight
  if (!W || !H) return
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
  pointerInside = true
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

function onMouseEnter() {
  pointerInside = true
  fluidDecayFrames = 40
  requestRender()
}

function onMouseLeave() {
  pointerInside = false
  onMouseUp()
  // Keep the loop alive briefly so the trail drains and the reveal fades out.
  fluidDecayFrames = 60
  requestRender()
}

function onWheel(e) {
  // Stacked layout (narrow window): let the wheel scroll the page instead of
  // zooming the model — otherwise the cursor over the 3D blocks page scroll.
  if (window.innerWidth <= 768) return
  e.preventDefault()
  spherical.radius += e.deltaY * 0.001 * modelSize
  spherical.radius = Math.max(minZoom, Math.min(maxZoom, spherical.radius))
  updateCameraPosition()
  requestRender()
}

let touchStart = null
// Finger spread at the last touch event — drives pinch-to-zoom.
let lastTouchDist = 0
// Centroid of the first two touches — drives the 3D on a two-finger drag.
function twoFingerCenter(e) {
  const a = e.touches[0], b = e.touches[1]
  return { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 }
}
// Distance between the two active touches — drives pinch-to-zoom.
function twoFingerDist(e) {
  const a = e.touches[0], b = e.touches[1]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}
function onTouchStart(e) {
  // One finger scrolls the page; only a two-finger gesture drives the 3D.
  if (e.touches.length < 2) return
  e.preventDefault()
  touchStart = twoFingerCenter(e)
  lastTouchDist = twoFingerDist(e)
  onMouseDown(touchStart)
}

function onTouchMove(e) {
  if (e.touches.length < 2) return
  e.preventDefault()
  // Pinch to zoom: scale the camera radius by how the finger spread changed.
  // Spreading fingers (dist grows) shrinks the radius → zoom in; pinching zooms out.
  const dist = twoFingerDist(e)
  if (lastTouchDist > 0 && dist > 0) {
    spherical.radius *= lastTouchDist / dist
    spherical.radius = Math.max(minZoom, Math.min(maxZoom, spherical.radius))
    updateCameraPosition()
  }
  lastTouchDist = dist
  onMouseMove(twoFingerCenter(e))
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
  resizeObserver?.disconnect()
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
  background: transparent;
  overflow: hidden;
}

.scene-canvas {
  display: block;
  width: 100%;
  height: 100%;
  /* One-finger touch scrolls the page; two-finger gestures rotate the 3D.
     pan-y lets the browser own vertical scroll and disables pinch-zoom so the
     two-finger handler reliably receives its events. */
  touch-action: pan-y;
}

.scene-loader {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
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
