import { ref } from 'vue'

const REC_DURATION = 20
const SEQ_FPS = 30
const SEQ_TOTAL_FRAMES = REC_DURATION * SEQ_FPS  // 600 frames

interface Options {
  getCanvas: () => HTMLCanvasElement | null
  getXrayScene: () => object | null
  getCamera: () => object | null
  getRenderer: () => any
  getSpherical: () => { theta: number; phi: number; radius: number }
  getAutoRotate: () => boolean
  setAutoRotate: (v: boolean) => void
  updateCameraPosition: () => void
  requestRender: () => void
}

export function usePngSequence({
  getCanvas, getXrayScene, getCamera, getRenderer,
  getSpherical, getAutoRotate, setAutoRotate,
  updateCameraPosition, requestRender
}: Options) {
  const isRecording = ref(false)
  const recLabel = ref('')

  async function startPngSequence() {
    const canvas = getCanvas()
    const xrayScene = getXrayScene()
    const camera = getCamera()
    const renderer = getRenderer()
    const spherical = getSpherical()

    if (isRecording.value || !canvas || !xrayScene || !renderer) return

    let dirHandle: FileSystemDirectoryHandle
    try {
      dirHandle = await (window as any).showDirectoryPicker()
    } catch {
      return
    }

    const savedTheta = spherical.theta
    const savedAutoRotate = getAutoRotate()
    setAutoRotate(false)
    isRecording.value = true

    const rotPerFrame = (2 * Math.PI) / SEQ_TOTAL_FRAMES
    renderer.setClearColor(0x000000, 0)

    for (let i = 0; i < SEQ_TOTAL_FRAMES; i++) {
      recLabel.value = `${i + 1} / ${SEQ_TOTAL_FRAMES}`
      spherical.theta = i * rotPerFrame
      updateCameraPosition()
      renderer.setRenderTarget(null)
      renderer.render(xrayScene, camera)

      const blob: Blob = await new Promise(resolve =>
        canvas.toBlob(resolve as BlobCallback, 'image/png')
      )
      const fileName = `frame_${String(i + 1).padStart(4, '0')}.png`
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()
    }

    spherical.theta = savedTheta
    setAutoRotate(savedAutoRotate)
    isRecording.value = false
    requestRender()
  }

  return { isRecording, recLabel, startPngSequence }
}
