/**
 * CMS 3D model URL per object slug, for the Research overlay previews.
 *
 * The site is statically generated: /api/CMS_KQLRequest only exists at build
 * time. The overlay is <ClientOnly>, so fetching from it hit the API at runtime
 * (404 in production → empty previews). Instead app.vue — which is prerendered
 * on every page — calls `loadObjectModels()`; the result lands in the payload
 * as shared state and the overlay just reads `useObjectModels()`.
 */
type ModelsResponse = { result?: { slug: string; model: { url: string } | null }[] }

export function useObjectModels() {
  return useState<Record<string, string>>('objectModels', () => ({}))
}

export async function loadObjectModels() {
  const models = useObjectModels()
  if (Object.keys(models.value).length) return
  const { data } = await useFetch<ModelsResponse>('/api/CMS_KQLRequest', {
    key: 'object-models',
    method: 'POST',
    body: {
      query: "page('objects').children.listed",
      select: {
        slug: true,
        model: { query: 'page.model_file.toFile', select: { url: true } },
      },
    },
  })
  const map: Record<string, string> = {}
  for (const o of data.value?.result ?? []) {
    if (o.model?.url) map[o.slug] = o.model.url
  }
  models.value = map
}
