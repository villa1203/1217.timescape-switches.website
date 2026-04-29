export type CMS_API_Response = {
  code: number,
  status: 'ok' | string,
}

export type CMS_API_ImageInstance = {
  "alt":    null | string,
  "tiny":   CMS_API_Image,
  "small":  CMS_API_Image,
  "reg":    CMS_API_Image,
  "large":  CMS_API_Image,
  "xxl":    CMS_API_Image,
}

export type CMS_API_Image = {
  "extension": string,
  "filename": string,
  "height": number,
  "id": string,
  "mime": string,
  "niceSize": string,
  "template": string
  "type": "image",
  "url": string,
  "width": number
}

export type CMS_API_Page_projet = {
  title: string,
  baseline: string,
  slug: string,
  intro: string,
  id: string,
  preview_full_size: 'true' | 'false',
  covers_video?: {
    url: string,
  },
  cover?: CMS_API_ImageInstance,
  gallery: CMS_API_ImageInstance[],
  sectors: {
    title: string,
    slug: string,
  }[]
  miniature: CMS_API_ImageInstance,
  collaborators: {
    title: string,
    slug: string,
  }[],
  clients: {
    title: string,
    slug: string,
  }[],

  date: string,
  services: {
    title: string,
    slug: string,
  }[],
  localisation: string,
  photo_credits: string,
  content: CMS_BlockData[],
}

export type CMS_BlockData =
  CMS_BlockArticleHeadingData |
  CMS_BlockImageData |
  CMS_BlockTextData |
  CMS_BlockPages |
  CMS_BlockVideoData |
  CMS_BlockClientList |
  CMS_BlockProfiles |
  CMS_BlockSketchText |
  CMS_BlockGalleryData

export interface CMS_BlockDataBase {
  "id": string,
  "isHidden": boolean,
  "type": "article_heading" | "image" | "text" | "video" | "pages_list" | "clients_list" | "profiles" | 'sketch_text' | 'gallery'
}

export interface CMS_BlockArticleHeadingData extends CMS_BlockDataBase {
  "content": {
    "title": string,
    "text": string
  },
  type: "article_heading"
}

export interface CMS_BlockImageData extends CMS_BlockDataBase {
  "content": {
    "title": string,
    "text": string

    image: CMS_API_ImageInstance,
    toggle_gap_left: 'true' | 'false',
    toggle_ratio_1_1: 'true' | 'false',
    toggle_is_large: 'true' | 'false',
    toggle_is_full: 'true' | 'false',
    caption: string
    credits: string
  },
  "id": string,
  "isHidden": boolean,
  "type": "image"
}

export interface CMS_BlockGalleryData extends CMS_BlockDataBase {
  "content": {
    "title": string,
    "text": string
    images: CMS_API_ImageInstance[],
    caption: string
    credits: string
  },
  "id": string,
  "isHidden": boolean,
  "type": "gallery"
}


export interface CMS_BlockTextData extends CMS_BlockDataBase {
  "content": {
    "title": string,
    "text": string
  },
  "id": string,
  "isHidden": boolean,
  "type": "text"
}

export interface CMS_BlockSketchText extends CMS_BlockDataBase {
  "id": string,
  "isHidden": boolean,
  "type": "sketch_text"
}


export interface CMS_BlockVideoData extends CMS_BlockDataBase {
  "content": {
    title?: string,
    url?: string
    toggle_gap_left: 'true' | 'false',
    toggle_is_large: 'true' | 'false',
    toggle_is_full: 'true' | 'false',
    toggle_ratio_1_1: 'true' | 'false',
    video_file?: {
      url: string,
      id: string,
      filename: string,
      mime: string,
    }[] | null,
    caption?: string,
    credits?: string,
  },
  "type": "video"
}

export interface CMS_BlockPages extends CMS_BlockDataBase {
  "content": {
    title?: string,
    pages_liste?: CMS_API_Page_projet[],
    is_style_list?: boolean,
  },
  "type": "pages_list"
}

export interface CMS_BlockClientList extends CMS_BlockDataBase {
  "content": {
    title?: string,
  },
  "type": "clients_list"
}

export interface CMS_BlockProfiles extends CMS_BlockDataBase {
  "content": {
    "profiles_list": {
      photo: CMS_API_ImageInstance | null
      first_name: string
      last_name: string
      function: string
      roles: string
      id: string
    }[]
  },
  "type": "profiles"
}
