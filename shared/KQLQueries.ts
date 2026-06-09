export const KQL_SELECT_BLOCKS = {
    id: true,
    type: true,
    isHidden: true,
    content: {
      query: "block.content",
      select: {
        title: true,
        text: true,
        url: true,
        caption: true,
        credits: true,

        images: {
          query: "content.images.toFiles",
          select: {
            alt: "file.alt.value",
            tiny: "file.resize(50, null, 10)",
            small: "file.resize(500)",
            reg: "file.resize(1280)",
            large: "file.resize(1920)",
            xxl: "file.resize(2500)",
            focus: "file.focus",
          },
        },

        image: {
          query: "content.image.toFiles.first",
          select: {
            alt: "file.alt.value",
            tiny: "file.resize(50, null, 10)",
            small: "file.resize(500)",
            reg: "file.resize(1280)",
            large: "file.resize(1920)",
            xxl: "file.resize(2500)",
            focus: "file.focus",
          },
        },
        toggle_gap_left: true,
        toggle_is_large: true,
        toggle_is_full: true,
        toggle_ratio_1_1: true,


        is_style_list: {
          query: "content.is_style_list.toBool",
        },

        profiles_list: {
          query: "content.profiles_list.toStructure",
          select: {
            photo: {
              query: "structureItem.content.photo.toFiles.first",
              select: {
                alt: "file.alt.value",
                tiny: "file.resize(50, null, 10)",
                small: "file.resize(500)",
                reg: "file.resize(1280)",
                large: "file.resize(1920)",
                xxl: "file.resize(2500)",
                focus: "file.focus",
              },
            },
            first_name: "structureItem.content.first_name",
            last_name: "structureItem.content.last_name",
            function: "structureItem.content.function",
            roles: "structureItem.content.roles",
            id: "structureItem.content.id",
          },
        },

        pages_liste: {
          query: "content.pages_liste.toPages",
          select: {
            id: true,
            title: true,
            slug: true,
            baseline: true,
            preview_full_size: true,
            services: {
              query: 'page.services.toPages',
              select: {
                title: true,
                slug: true,
              }
            },
            covers_video: {
              query: "page.covers_video.toFiles.first",
              select: {
                url: true,
              }
            },
            cover: {
              query: "page.covers.toFiles.first",
              select: {
                alt: "file.alt.value",
                tiny: "file.resize(50, null, 10)",
                small: "file.resize(500)",
                reg: "file.resize(1280)",
                large: "file.resize(1920)",
                xxl: "file.resize(2500)",
                focus: "file.focus",
              },
            },
          },
        },

        video_file: {
          query: "content.video_file.toFiles",
          select: {
            url: true,
            id: true,
            filename: true,
            mime: true,
          },
        },
      },
    },
}

export const KQL_SELECT_IMAGE = {
  alt: "file.alt.value",
  tiny: "file.resize(50, null, 10)",
  small: "file.resize(500)",
  reg: "file.resize(1280)",
  large: "file.resize(1920)",
  xxl: "file.resize(2500)",
  focus: "file.focus",
}

// ── SEO ─────────────────────────────────────────────────────────────────────
// Per-page SEO fields (blueprint tabs/seo.yml). `model` is the KQL context the
// select runs against: 'page' for page queries, 'site' for the site object.
// Toggles come back as raw "true"/"false"/"" strings — the front (useCmsSeo)
// treats anything but "false" as on, so unset = indexed by default.
export const seoSelect = (model: 'page' | 'site' = 'page') => ({
  seo_title: true,
  seo_description: true,
  og_title: true,
  og_description: true,
  og_image: {
    query: `${model}.og_image.toFile`,
    select: { url: true },
  },
  seo_index: true,
  seo_follow: true,
  seo_index_images: true,
})

// Site-wide SEO globals + defaults (blueprint site.yml SEO tab). Used as the
// home's own SEO and as fallbacks for every page.
export const siteSeoSelect = () => ({
  site_title: true,
  seo_description: true,
  og_description: true,
  og_image: {
    query: 'site.og_image.toFile',
    select: { url: true },
  },
  // Home indexation lives on the site object.
  seo_index: true,
  seo_follow: true,
  seo_index_images: true,
})

export const KQL_PROJECTS_SELECT = {
  title: true,
  slug: true,
  content: {
    query: "page.content.content.toBlocks",
    select: KQL_SELECT_BLOCKS,
  },

  cover_front: {
    query: "page.cover_front.toFiles",
    select: KQL_SELECT_IMAGE,
  },
  cover_back: {
    query: "page.cover_back.toFiles",
    select: KQL_SELECT_IMAGE,
  },
  strategies: true,
  baseline: true,

  // 3D model file (from the reusable model_3d blueprint tab). The front-end
  // object component loads this .glb URL instead of a hard-coded /public path.
  // Field is "model_file" (not "model") — "model" collides with Kirby's
  // reserved Page::model() method, which KQL refuses to query.
  model: {
    query: "page.model_file.toFile",
    select: {
      url: true,
      filename: true,
    },
  },
}
