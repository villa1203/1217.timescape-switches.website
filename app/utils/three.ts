/**
 * The subset of three.js used by the Three* object viewers.
 *
 * The components used to do `await import('three')` and read the namespace,
 * which pulls the whole library (~715 KB) into the chunk. Re-exporting only
 * what they use lets the bundler tree-shake the rest. Add a name here if a
 * viewer starts using a new THREE.* class.
 */
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export {
  ACESFilmicToneMapping,
  AmbientLight,
  Box3,
  CanvasTexture,
  Color,
  DirectionalLight,
  DoubleSide,
  LinearFilter,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  OrthographicCamera,
  PCFSoftShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  RGBAFormat,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three'
export { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
export { GLTFLoader }

/** Max device pixel ratio for the viewers (2 → 1.5 roughly halves the pixels). */
export const MAX_DPR = 1.5

// One download per .glb for the whole session: the Research overlay preview and
// the object page share it, and navigating back to an object doesn't refetch.
const buffers = new Map<string, Promise<ArrayBuffer>>()

/**
 * GLTFLoader with a per-URL download cache and Meshopt decoding enabled, so
 * models compressed with `gltf-transform optimize --compress meshopt` load as is.
 * Same `load(url, onLoad, onProgress, onError)` signature as GLTFLoader.
 */
export class CachedGLTFLoader extends GLTFLoader {
  constructor() {
    super()
    this.setMeshoptDecoder(MeshoptDecoder)
  }

  override load(url: string, onLoad: (gltf: GLTF) => void, _onProgress?: unknown, onError?: (err: unknown) => void) {
    let buf = buffers.get(url)
    if (!buf) {
      buf = fetch(url).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`)
        return r.arrayBuffer()
      })
      buffers.set(url, buf)
      buf.catch(() => buffers.delete(url)) // allow a retry after a failure
    }
    const base = url.slice(0, url.lastIndexOf('/') + 1)
    buf
      .then(data => this.parse(data, base, onLoad, err => onError?.(err)))
      .catch(err => onError?.(err))
  }
}
