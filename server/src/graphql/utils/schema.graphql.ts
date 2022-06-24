
const { gql } = require ("apollo-server-express");
export const typeDefs = gql`


type MetaData {
    title: String
    author: String
    link: String
    desc: String
    image: String
    img_width: Int
    img_height: Int
    img_type: String
    site: String
}

enum Extention {
    png
    jpg
}

enum FileType {
    image
    report
    contract
}


enum UniqueFieldType {
    email
    username
}


input Base64Image {
    content: String
    extension: Extention
}

# key and bucket are in model but not required seperately userside
# what is needed is a (signed) url
# might need to generate it on the fly in the resolver
# although not if it goes thru the CDN 

type File {
    _id: ID
    creator_id: String
    ext: Extention
    filetype: String
    url: String
#   key: String
    date: String
#   bucket: String
    target_id: String
    target_type: String
    status: String
}


input checkInput {
    field: UniqueFieldType
    value: String
}



input FileInput {
    buffer: String
    path: String
    originalname: String
}

type Mutation {
    uploadBase64Image(input:FileInput):File
}

type Query {
    scrape(targetUrl:String!): MetaData,
    available(field:UniqueFieldType, value: String):Boolean
}

`;