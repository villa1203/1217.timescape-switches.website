<template>
  <main class="v-info"
  >
    <AppLayoutColumns>
      <template v-slot:first>

        <div class="app-grid app-grid--justify-center">
          <div class="app-grid__col-12" >
            <!-- Pre-rendered WebP of TexteTMSINFO.svg at ~3x: the SVG's inner-
                 shadow filter is baked at high resolution, so it stays crisp on
                 mobile (browsers rasterise SVG filters at a capped resolution,
                 which pixelated both the <img> and the inlined SVG). -->
            <img src="/TexteTMSINFO.webp" alt="TMS Info" class="hero-svg" />
          </div>
        </div>

        <Blocks
          v-if="data?.result.content_secondary"
          :content="data?.result.content_secondary"
        />
      </template>
      <template v-slot:second>
        <Blocks
          v-if="data?.result.content"
          :content="data?.result.content"
        />

          <AppNewsletterForm
              baseURL=                    "https://1217contactapi.villa1203.deno.net"
              title=                      'Keep up with our research…'
              label=                      'Email address'
              placeholder=                'Your email address'
              submitLabel=                "Sign up"
              submittingLabel=            'Submitting...'
              successMessage=             'Thank you for signing up!'
              errorMessage=               'An error occurred. Please try again.'
              serverResponseErrorMessage= "Error validating the email address"
          />

        <div class="info-follow">
          <!-- Bureau 1217 wordmark → studio site. White SVG recoloured to the
               primary purple via the same feFlood/feComposite trick as the
               Research overlay's bureau logo. -->
          <a
            href="https://bureau1217.ch/"
            target="_blank"
            rel="noopener"
            class="info-follow__link"
            aria-label="Bureau 1217 website"
          >
            <svg class="info-follow__logo" viewBox="0 0 478.4 69" aria-hidden="true">
              <filter id="bureau-purple-info" x="0" y="0" width="100%" height="100%">
                <feFlood style="flood-color: var(--app-color-primary)" result="purple" />
                <feComposite in="purple" in2="SourceAlpha" operator="in" />
              </filter>
              <image href="/B1217_LOGO-BLANC-01.svg" x="0" y="0" width="478.4" height="69" filter="url(#bureau-purple-info)" />
            </svg>
          </a>

          <!-- Instagram → @bureau_1217. Inline glyph filled with the primary purple. -->
          <a
            href="https://www.instagram.com/bureau_1217/"
            target="_blank"
            rel="noopener"
            class="info-follow__link"
            aria-label="Follow Bureau 1217 on Instagram"
          >
            <span class="info-follow__insta">
              <svg class="info-follow__insta-glyph" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#ffffff" d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153a4.908 4.908 0 0 1 1.153 1.772c.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 0 1-1.153 1.772 4.915 4.915 0 0 1-1.772 1.153c-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 0 1-1.772-1.153 4.904 4.904 0 0 1-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.882 4.882 0 0 1 1.153-1.772A4.897 4.897 0 0 1 5.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 1.802c-2.67 0-2.986.01-4.04.058-.976.045-1.505.207-1.858.344-.466.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.048 1.055-.058 1.37-.058 4.041 0 2.67.01 2.986.058 4.04.045.976.207 1.505.344 1.858.182.466.399.8.748 1.15.35.35.684.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058 2.67 0 2.987-.01 4.04-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041 0-2.67-.01-2.986-.058-4.04-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 0 0-.748-1.15 3.098 3.098 0 0 0-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.055-.048-1.37-.058-4.041-.058zm0 3.063A5.135 5.135 0 1 1 12 17.135 5.135 5.135 0 0 1 12 6.865zm0 8.468A3.333 3.333 0 1 0 12 8.667a3.333 3.333 0 0 0 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0z" />
              </svg>
            </span>
          </a>
        </div>

      </template>
    </AppLayoutColumns>

    <!-- 3D Viewer Section -->
    <!-- <div class="viewer-section">
      <ThreeSwitch :mode="viewerMode" />
    </div> -->
  </main>
</template>


<script setup lang="ts">
import { ref } from 'vue'
import type {CMS_API_Response, CMS_BlockData} from "#shared/cms_api";
import AppLayoutColumns from "~/components/AppLayoutColumns.vue";
import { seoSelect, siteSeoSelect } from "#shared/KQLQueries";
import { useCmsSeo, type CmsSeoFields, type CmsSiteSeo } from "~/composables/useCmsSeo";

const viewerMode = ref('normal')

type FetchData = CMS_API_Response & {
  "result": {
    "title": string,
    "slug": string,
    content: CMS_BlockData[]
    content_secondary: CMS_BlockData[]
    site: CmsSiteSeo
  } & CmsSeoFields
}

const {data} = useFetch<FetchData>('/api/CMS_KQLRequest', {
  // Not lazy: SEO meta must be in the server-rendered HTML for crawlers.
  method: 'POST',
  body: {
    query: `page('infos')`,
    select: {
      title: true,
      slug: true,
      content: {
        query: `page.content.content.toBlocks`,
      },
      content_secondary: {
        query: `page.content.content_secondary.toBlocks`,
      },
      ...seoSelect('page'),
      site: { query: 'site', select: siteSeoSelect() },
    }
  }
})

useCmsSeo(() => ({
  page: data.value?.result,
  site: data.value?.result?.site,
  path: '/info',
  fallbackTitle: data.value?.result?.title,
}))

</script>


<style lang="scss" scoped>
.v-info {

// Title WebP scales to the column width.
.hero-svg {
  display: block;
  width: 100%;
  height: auto;
}

.viewer-section {
  position: relative;
  width: 100%;
  height: 100vh;
}

.viewer-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
}

.viewer-controls button {
  padding: 10px 20px;
  background: white;
  border: 2px solid #000;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.viewer-controls button:hover {
  background: #f0f0f0;
}

.viewer-controls button.active {
  background: #000;
  color: #fff;
}

// "Follow us" logos: Bureau 1217 wordmark + Instagram glyph, both purple.
.info-follow {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  margin-top: 1rem;
}
.info-follow__link {
  display: inline-flex;
  align-items: center;
  transition: opacity 0.2s ease;

  &:hover { opacity: 0.7; }
}
.info-follow__logo {
  display: block;
  height: 1.5rem;
  width: auto;
}
// Instagram in a round purple chip with the sticker "blob" gradient (soft white
// inner glow fading from the edge to the centre, like the newsletter button),
// white glyph on top.
.info-follow__insta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  box-sizing: border-box;
  border-radius: 50%;
  background: var(--app-color-primary);
  border: 2px solid var(--app-color-light);
  /* Inner glow kept tight to the rim (smaller blur) so the white sits toward the
     outer edge of the circle, leaving a cleaner purple centre behind the glyph. */
  box-shadow: inset 0 0 7px color-mix(in srgb, var(--app-color-light) 80%, transparent);
}
.info-follow__insta-glyph {
  display: block;
  width: 1.15rem;
  height: 1.15rem;
}
}
</style>

.viewer-section {
  position: relative;
  width: 100%;
  height: 100vh;
}

.viewer-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 100;
  display: flex;
  gap: 10px;
}

.viewer-controls button {
  padding: 10px 20px;
  background: white;
  border: 2px solid #000;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.2s;
}

.viewer-controls button:hover {
  background: #f0f0f0;
}

.viewer-controls button.active {
  background: #000;
  color: #fff;
}
