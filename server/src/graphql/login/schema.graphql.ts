const { gql } = require ("apollo-server-express");
export const typeDefs = gql`
type Query {
  hello(name:String): String!,
}

input RegisterInput {
  email:String!
  password:String!
  username:String!
  name: String
  first_name: String
  profileUrl: String
}

type LoginResponse {
  status:Boolean!,
  jwt:String,
  message:String
}

enum ImageTargetType {
    idea
    comment
    mission
    user
    post
}

type FileUrlType {
  url: String
  file_id: String
  final_url: String
}

input FileRequestInput {
  filename: String
  target_id: String
  target_type: ImageTargetType
}


type Mutation {
  register(user: RegisterInput): String
  login(email: String!, password:String!): String
  getSignedUrl(input:FileRequestInput):FileUrlType
  fileUploadComplete(input:FileRequestInput):Boolean
}

`;