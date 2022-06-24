const { gql } = require("apollo-server-express");
import { importSchema } from "graphql-import";
// export const typeDefs = importSchema('./social.graphql')
import { userDef } from "../core/schema.graphql";

export const typeDefs = gql`
  # import User from ../users/schema.graphql

  ${userDef}

  extend type User {
    friends: [Friendship]
    friend_count: Int
  }

  input FileInput {
    buffer: String
    path: String
    originalname: String
  }

  enum PostFilterType {
    FRIENDS
    ALL
  }

  input PostFilter {
      filter: PostFilterType,
      cursor: String
      limit: Int
  }


  type UserReadCursor {
    user: String
    message: String
  }

  type Message {
    _id: ID
    from: String
    msg: String
    urldata: UrlData
    conv: String
  }

  type Conversation {
    usr1: String
    usr2: String
    target_id: String
    _id: ID
    messages: [Message]
    unread: Int
    current_page: Int
    read: [UserReadCursor]
  }

  type CommentFeed {
    target_id: String
    target_type: String
    comments: [Comment]
    cursor: String
  }

  input UrlDataInput {
    link: String!
    image: String
    title: String
    desc: String
    site: String
    img_width: Int
    img_height: Int
  }

  type UrlData {
    link: String
    image: String
    title: String
    desc: String
    site: String
    img_width: Int
    img_height: Int
  }

  input LikeInput {
    target_id: String
    nb: Int
    meaning: LikeType
    target_type: LikeTargetType
  }

  input PostUpdateInput {
    _id: String!
    title: String
    description: String
    urldata: UrlDataInput
    link: String
    image: String
    image_url: String
  }

  input PostInput {
    title: String!
    description: String
    urldata: UrlDataInput
    link: String
    image: String
    image_url: String
  }

  type Post {
    _id: ID!
    creator_id: String
    title: String
    description: String
    urldata: UrlData
    created: String
    link: String
    image: String # represents an image _id
    image_url: String # when there is one
    creator: User
    likes_up: Int
    likes_down: Int
    comment_nb: Int
    liked: Boolean
  }

  type Event {
    _id: ID
    title: String
    description: String
    # image
    start: String
    end: String
    address: String
    url: UrlData
  }

  type Friendship {
    _id: ID
    from: String
    to: String
    state: String
    user: User
  }

  type PageFeed {
    posts: [Post]
    startCursor: String
    endCursor: String
  }

  input ReadInput {
    other_user_id: String
    message_id: String
  }

  type Query {
    currentPosts(input: PostFilter): [Post]
    currentPostPage(input: PostFilter): PageFeed
    userFriends(user_id: String): [Friendship]
    conversations(cursor: String, limit: Int): [Conversation]
    conversation(user: String): Conversation
    findUsers(input: String): [User]
    findUser(email: String): User
  }

  type Mutation {
    setReadMessage(input: ReadInput): Boolean
    createPost(input: PostInput): Post
    deletePost(id: String): Boolean
    updatePost(input: PostUpdateInput): Post
    likeItem(input: LikeInput): LikeReward
    requestFriend(other_user: String!): Friendship
    sendMessage(user: String, message: String): Message
  }
`;
