// Dynamic robots.txt — allows all crawlers and points to the sitemap (absolute
// URL from runtimeConfig.public.siteUrl). Per-page indexing is controlled by the
// CMS toggles, surfaced as <meta name="robots"> on each page.
import { getRequiredSiteUrl } from '../utils/siteUrl'

export default defineEventHandler((event) => {
  const siteUrl = getRequiredSiteUrl('robots.txt')

  const lines = ['User-agent: *', 'Allow: /', '', `Sitemap: ${siteUrl}/sitemap.xml`]

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return lines.join('\n') + '\n'
})
