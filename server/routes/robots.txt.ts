// Dynamic robots.txt — allows all crawlers and points to the sitemap (absolute
// URL from runtimeConfig.public.siteUrl). Per-page indexing is controlled by the
// CMS toggles, surfaced as <meta name="robots"> on each page.
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const siteUrl = String(config.public.siteUrl || '').replace(/\/+$/, '')

  const lines = ['User-agent: *', 'Allow: /']
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`)

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return lines.join('\n') + '\n'
})
