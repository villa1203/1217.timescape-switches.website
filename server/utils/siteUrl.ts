export const getRequiredSiteUrl = (routeName: string) => {
  const config = useRuntimeConfig()
  const siteUrl = String(config.public.siteUrl || '').replace(/\/+$/, '')

  if (!siteUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: `NUXT_PUBLIC_SITE_URL is required to generate ${routeName}`,
    })
  }

  return siteUrl
}
