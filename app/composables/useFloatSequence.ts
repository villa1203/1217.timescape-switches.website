import { ref } from 'vue'

const SEQ_FPS          = 60
const SINGLE_EXPORT_PX = 4096  // single-image export resolution (square)

interface Options {
  getCanvas: () => HTMLCanvasElement | null
  getModel: () => any
  getXrayModel: () => any
  getAmplitude: () => number
  getFloatPeriod: () => number   // half-cycle seconds (same as FLOAT_PERIOD in component)
  getFloatMode: () => boolean
  setFloatMode: (v: boolean) => void
  getRenderer: () => any
  getCamera: () => any
  renderFrame: () => void
  requestRender: () => void
}

export function useFloatSequence({
  getCanvas, getModel, getXrayModel, getAmplitude, getFloatPeriod,
  getFloatMode, setFloatMode,
  getRenderer, getCamera,
  renderFrame, requestRender
}: Options) {
  const isExporting       = ref(false)
  const exportLabel       = ref('')
  const isExportingSingle = ref(false)

  /* ── sequence export ── */
  async function startFloatExport() {
    const canvas = getCanvas()
    if (isExporting.value || isExportingSingle.value || !canvas) return

    let dirHandle: FileSystemDirectoryHandle
    try {
      dirHandle = await (window as any).showDirectoryPicker()
    } catch { return }

    isExporting.value = true
    const wasFloatMode = getFloatMode()
    setFloatMode(false)

    const amplitude    = getAmplitude()
    const fullCycleSecs = getFloatPeriod() * 2
    const totalFrames  = Math.round(fullCycleSecs * SEQ_FPS)

    for (let i = 0; i < totalFrames; i++) {
      exportLabel.value = `${i + 1} / ${totalFrames}`
      const t = i / totalFrames
      const y = amplitude * Math.cos(2 * Math.PI * t)

      const m = getModel(); const x = getXrayModel()
      if (m) m.position.y = y
      if (x) x.position.y = y

      renderFrame()

      const blob: Blob = await new Promise(resolve =>
        canvas.toBlob(resolve as BlobCallback, 'image/png')
      )
      const fileName = `float_${String(i + 1).padStart(4, '0')}.png`
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write(blob)
      await writable.close()
    }

    const m = getModel(); const x = getXrayModel()
    if (m) m.position.y = 0
    if (x) x.position.y = 0
    setFloatMode(wasFloatMode)
    isExporting.value = false
    requestRender()
  }

  /* ── single high-res export ── */
  async function startSingleExport() {
    const canvas   = getCanvas()
    const renderer = getRenderer()
    const cam      = getCamera()
    if (isExporting.value || isExportingSingle.value || !canvas || !renderer || !cam) return

    isExportingSingle.value = true
    const wasFloatMode = getFloatMode()
    setFloatMode(false)

    // Save original state
    const origW     = canvas.width
    const origH     = canvas.height
    const origRatio = renderer.getPixelRatio()
    const origAspect = cam.aspect

    // Upscale to max quality: square crop, pixel ratio 1
    renderer.setPixelRatio(1)
    renderer.setSize(SINGLE_EXPORT_PX, SINGLE_EXPORT_PX, false)
    cam.aspect = 1
    cam.updateProjectionMatrix()

    renderFrame()

    const blob: Blob = await new Promise(resolve =>
      canvas.toBlob(resolve as BlobCallback, 'image/png')
    )

    // Restore
    renderer.setPixelRatio(origRatio)
    renderer.setSize(origW, origH, false)
    cam.aspect = origAspect
    cam.updateProjectionMatrix()
    setFloatMode(wasFloatMode)
    isExportingSingle.value = false
    requestRender()

    // Trigger download
    const url = URL.createObjectURL(blob)
    const a   = document.createElement('a')
    a.href     = url
    a.download = 'export.png'
    a.click()
    URL.revokeObjectURL(url)
  }

  return { isExporting, exportLabel, startFloatExport, isExportingSingle, startSingleExport }
}
