

export  interface PostFilter {
  filter: string,
  cursor: string
  limit: number
}

export  interface PostFilterInput {
  input : PostFilter
}



export interface LikeInput { input: {
    target_type:string,
    target_id: string,
    nb: number
    meaning?: string
}}

export interface FileInput {
    buffer: string,
    path: string,
    originalname: string
}

export interface UrlDataInput {
    link:string,
    image:string,
    title:string,
    desc:string,
    site: string,
    img_width: number,
    img_height: number,
    img_type: string
}
export interface IdInput {
    id:string
}


export interface PostUpdateInput {input:{
    _id: string,
    title: string,
    description: string,
    urldata: UrlDataInput
    link: string,
    image: string,
    image_url: string
}}

export interface PostInput {input:{
    title: string,
    description: string,
    urldata: UrlDataInput
    link: string,
    image: string,
    image_url: string
}}
