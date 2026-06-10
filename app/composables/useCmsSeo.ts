
/**
 * Applies CMS-driven SEO to the current page: <title>, description, Open Graph,
 * Twitter cards, robots directives and the canonical link.
 *
 * Fed by the `seoSelect()` / `siteSeoSelect()` KQL helpers. Pass a getter so it
 * stays reactive while the (lazy) fetch resolves. Fallback chain:
 *   title       : page.seo_title  → site_title
 *   description : page.seo_description → site.seo_description
 *   og:title    : page.og_title → page.seo_title → site_title
 *   og:descr.   : page.og_description → page.seo_description → site.* → ''
 *   og:image    : page.og_image → site.og_image
 */
type SeoImage = { url?: string | null } | null | undefined

export type CmsSeoFields = {
  seo_title?: string | null
  seo_description?: string | null
  og_title?: string | null
  og_description?: string | null
  og_image?: SeoImage
  seo_index?: string | boolean | null
  seo_follow?: string | boolean | null
  seo_index_images?: string | boolean | null
}

export type CmsSiteSeo = {
  site_title?: string | null
  seo_description?: string | null
  og_description?: string | null
  og_image?: SeoImage
} & Partial<CmsSeoFields>

type SeoInput = {
  page?: CmsSeoFields | null
  site?: CmsSiteSeo | null
  /** Path for the canonical URL. Defaults to the current route path. */
  path?: string
  /** Natural page title (e.g. content title), used when seo_title is empty. */
  fallbackTitle?: string | null
  /** Natural description (e.g. baseline), used when seo_description is empty. */
  fallbackDescription?: string | null
}

// CMS toggles arrive as "true"/"false"/"" — treat anything but an explicit
// "false" as on, so a page that never set the field is indexed by default.
const on = (v: unknown) => v !== 'false' && v !== false

export function useCmsSeo(getter: () => SeoInput) {
  const config = useRuntimeConfig()
  const route = useRoute()
  const siteUrl = String(config.public.siteUrl || '').replace(/\/+$/, '')

  const seo = computed(() => {
    const input = getter()
    const p = input.page ?? {}
    const s = input.site ?? {}

    const siteTitle = s.site_title || ''
    const pageTitle = p.seo_title || input.fallbackTitle || ''
    const title = pageTitle
      ? (siteTitle ? `${pageTitle} — ${siteTitle}` : pageTitle)
      : siteTitle

    const description = p.seo_description || input.fallbackDescription || s.seo_description || ''
    const ogTitle = p.og_title || pageTitle || siteTitle
    const ogDescription =
      p.og_description || p.seo_description || input.fallbackDescription ||
      s.og_description || s.seo_description || ''
    const ogImage = p.og_image?.url || s.og_image?.url || ''

    const robots = [
      on(p.seo_index) ? 'index' : 'noindex',
      on(p.seo_follow) ? 'follow' : 'nofollow',
      on(p.seo_index_images) ? '' : 'noimageindex',
    ]
      .filter(Boolean)
      .join(', ')

    const path = input.path ?? route.path
    const canonical = siteUrl ? siteUrl + path : ''

    return { title, description, ogTitle, ogDescription, ogImage, siteTitle, robots, canonical }
  })

  useSeoMeta({
    title: () => seo.value.title || undefined,
    description: () => seo.value.description || undefined,
    ogTitle: () => seo.value.ogTitle || undefined,
    ogDescription: () => seo.value.ogDescription || undefined,
    ogImage: () => seo.value.ogImage || undefined,
    ogType: 'website',
    ogSiteName: () => seo.value.siteTitle || undefined,
    ogUrl: () => seo.value.canonical || undefined,
    twitterCard: 'summary_large_image',
    twitterTitle: () => seo.value.ogTitle || undefined,
    twitterDescription: () => seo.value.ogDescription || undefined,
    twitterImage: () => seo.value.ogImage || undefined,
  })

  useHead({
    meta: [{ name: 'robots', content: () => seo.value.robots }],
  })

  // Canonical: the path is known at setup, so register it as a static link
  // (avoids passing a function as `link`, which isn't a supported useHead form).
  const canonical = siteUrl ? siteUrl + (getter().path ?? route.path) : ''
  if (canonical) {
    useHead({ link: [{ rel: 'canonical', href: canonical }] })
  }
}
