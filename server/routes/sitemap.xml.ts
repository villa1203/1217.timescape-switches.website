// Dynamic sitemap. Lists the public front-end routes, pulling each page's
// indexation toggle from the CMS so `noindex` pages are excluded. URLs are
// absolute, built from runtimeConfig.public.siteUrl.
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = String(config.public.siteUrl || '').replace(/\/+$/, '')

  // Default to indexed unless the CMS toggle is explicitly "false".
  const indexed = (v: unknown) => v !== 'false' && v !== false

  let result: Record<string, any> = {}
  try {
    const res = await $fetch<{ result?: Record<string, any> }>('/api/CMS_KQLRequest', {
      method: 'POST',
      body: {
        query: 'site',
        select: {
          seo_index: true,
          info: { query: "page('infos')", select: { seo_index: true } },
          research: { query: "page('research')", select: { seo_index: true } },
          objects: {
            query: "page('objects').children.listed",
            select: { slug: true, seo_index: true },
          },
        },
      },
    })
    result = res?.result ?? {}
  } catch {
    // CMS unreachable: still emit a minimal valid sitemap below.
    result = {}
  }

  const paths: string[] = []
  if (indexed(result.seo_index)) paths.push('/')
  if (result.info && indexed(result.info.seo_index)) paths.push('/info')
  if (result.research && indexed(result.research.seo_index)) paths.push('/research')
  for (const obj of result.objects ?? []) {
    if (indexed(obj?.seo_index)) paths.push(`/objects/${obj.slug}`)
  }

  const urls = paths
    .map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`)
    .join('\n')

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `${urls}\n` +
    `</urlset>\n`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return xml
})
