/*
 * Singleton bridge to the sticker-measurement Worker.
 *
 * One Worker is shared across every StickerParagraph instance. The first call
 * spins it up (client-only) and sends the font list to load; subsequent calls
 * just post `measure` requests and await the matching reply by id.
 *
 * measure() rejects if there's no Worker (SSR or unsupported) so the caller
 * can fall back to its own DOM-based measurement.
 */

export interface StickerMeasureParams {
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: string | number
  maxWidth: number
  fillMaxWidth: boolean
  pad: number
  innerWidth: number
}

export interface StickerMeasureResult {
  lines: string[]
  svgWidth: number
}

let worker: Worker | null = null
let workerFailed = false
let nextId = 1
const pending = new Map<number, (r: StickerMeasureResult) => void>()

function getWorker(): Worker | null {
  if (!import.meta.client || workerFailed) return null
  if (worker) return worker

  try {
    worker = new Worker(
      new URL('../workers/stickerMeasure.worker.ts', import.meta.url),
      { type: 'module' },
    )
  } catch {
    workerFailed = true
    return null
  }

  worker.onmessage = (e: MessageEvent) => {
    const { id, lines, svgWidth } = e.data
    const resolve = pending.get(id)
    if (resolve) {
      pending.delete(id)
      resolve({ lines, svgWidth })
    }
  }
  worker.onerror = () => { workerFailed = true }

  // Load the same fonts the stickers render with (absolute URLs so the Worker
  // resolves them against the site origin, not its own blob: location).
  const origin = window.location.origin
  worker.postMessage({
    type: 'init',
    fonts: [
      { family: 'Sligoil',        url: `${origin}/fonts/Sligoil-Micro.woff2`,                    weight: '400' },
      { family: 'Sligoil',        url: `${origin}/fonts/Sligoil-MicroMedium.woff2`,              weight: '500' },
      { family: 'Sligoil',        url: `${origin}/fonts/Sligoil-MicroBold.woff2`,                weight: '700' },
      { family: 'Happy Times NG', url: `${origin}/fonts/happy-times-NG_regular_master_web.woff2`, weight: '400' },
      { family: 'Happy Times NG', url: `${origin}/fonts/happy-times-NG_bold_master_web.woff2`,    weight: '700' },
    ],
  })

  return worker
}

export function useStickerMeasure() {
  function measure(params: StickerMeasureParams): Promise<StickerMeasureResult> {
    const w = getWorker()
    if (!w) return Promise.reject(new Error('sticker measure worker unavailable'))

    const id = nextId++
    return new Promise<StickerMeasureResult>((resolve) => {
      pending.set(id, resolve)
      w.postMessage({ type: 'measure', id, params })
    })
  }

  return { measure }
}
