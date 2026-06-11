/// <reference lib="webworker" />

/*
 * Off-main-thread text measurement for StickerParagraph.
 *
 * StickerParagraph needs to know, for a given text + font + available width,
 * where the lines wrap and how wide the resulting SVG is. The original
 * implementation did this on the main thread with a hidden <svg><text> and
 * getBBox() — synchronous DOM layout that janks when many stickers mount.
 *
 * A Worker has no DOM, but it does have OffscreenCanvas + FontFace, so we load
 * the same fonts here and measure with ctx.measureText(). Metrics differ very
 * slightly from getBBox (advance width vs glyph bbox) so a wrap may shift by a
 * word in edge cases — accepted trade-off for keeping the main thread free.
 */

interface FontSpec {
  family: string
  url: string
  weight: string
  style?: string
}

interface MeasureParams {
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: string | number
  maxWidth: number
  fillMaxWidth: boolean
  pad: number
  innerWidth: number
}

const canvas = new OffscreenCanvas(1, 1)
const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D

// Resolves once ALL fonts have loaded (fallback when we can't tell which family
// a measure needs). `familyReady` resolves per family so a measure only waits
// for the one font it actually uses — e.g. body text in 'Happy Times NG' no
// longer blocks on the (separately downloaded) Sligoil faces. This matters on
// mobile, where waiting for every font delayed all but the first paragraph.
let fontsReady: Promise<void> | null = null
const familyReady = new Map<string, Promise<void>>()

function loadFonts(fonts: FontSpec[]): void {
  const byFamily = new Map<string, Promise<void>[]>()

  const all = fonts.map(async (f) => {
    const p = (async () => {
      try {
        const face = new FontFace(f.family, `url(${f.url})`, {
          weight: f.weight,
          style: f.style ?? 'normal',
        })
        await face.load()
        // @ts-expect-error — WorkerGlobalScope.fonts exists at runtime
        self.fonts.add(face)
      } catch {
        // A failed font just falls back to default metrics for that family.
      }
    })()
    if (!byFamily.has(f.family)) byFamily.set(f.family, [])
    byFamily.get(f.family)!.push(p)
    return p
  })

  for (const [family, ps] of byFamily) {
    familyReady.set(family, Promise.all(ps).then(() => undefined))
  }
  fontsReady = Promise.all(all).then(() => undefined)
}

// Pick the readiness promise for the first known family named in the CSS font
// stack (e.g. "'Happy Times NG', Georgia, serif"); fall back to all fonts.
function readyFor(fontFamily: string): Promise<void> | null {
  for (const [family, pr] of familyReady) {
    if (fontFamily.includes(family)) return pr
  }
  return fontsReady
}

function computeLines(p: MeasureParams): { lines: string[]; svgWidth: number } {
  ctx.font = `${p.fontWeight} ${p.fontSize}px ${p.fontFamily}`

  // Mirror of the original main-thread logic (see StickerParagraph history).
  const VIEWPORT_PAD = 32
  const cappedMax = Math.min(p.maxWidth, p.innerWidth - VIEWPORT_PAD)
  const availW = p.fillMaxWidth ? cappedMax - p.pad * 1.5 : cappedMax - p.pad * 2

  const MOBILE_BREAKPOINT = 768
  const isMobile = p.innerWidth <= MOBILE_BREAKPOINT
  const sourceText = isMobile ? p.text.replace(/\n/g, ' ') : p.text
  const segments = sourceText.split('\n')

  const result: string[] = []
  let maxW = 0

  for (const segment of segments) {
    const words = segment.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      result.push('')
      continue
    }

    let current = ''
    for (const word of words) {
      const test = current ? `${current} ${word}` : word
      const w = ctx.measureText(test).width
      if (w > availW && current) {
        maxW = Math.max(maxW, ctx.measureText(current).width)
        result.push(current)
        current = word
      } else {
        current = test
      }
    }

    if (current) {
      maxW = Math.max(maxW, ctx.measureText(current).width)
      result.push(current)
    }
  }

  const lines = result.length > 0 ? result : [p.text]
  const svgWidth = p.fillMaxWidth
    ? Math.ceil(cappedMax)
    : Math.ceil(maxW + p.pad * 2)

  return { lines, svgWidth }
}

self.onmessage = async (e: MessageEvent) => {
  const data = e.data

  if (data?.type === 'init') {
    loadFonts(data.fonts as FontSpec[])
    return
  }

  if (data?.type === 'measure') {
    const ready = readyFor((data.params as MeasureParams).fontFamily)
    if (ready) {
      try { await ready } catch { /* measure with whatever is available */ }
    }
    const res = computeLines(data.params as MeasureParams)
    ;(self as unknown as Worker).postMessage({ id: data.id, ...res })
  }
}
