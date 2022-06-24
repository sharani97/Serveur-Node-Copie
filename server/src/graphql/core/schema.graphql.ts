const { gql } = require ("apollo-server-express");


export const userDef = `


type Reward {
    gp: Float
    xp: Float
    kp: Float
    ap: Float
    ip: Float
}

type LikeReward {
    like: Like
    reward: Reward
}

type Point {
    _id:    ID
    user:   String
    dom:    String
    cat:    String
    primary:Boolean
    amount: Float
    updated:String
    created:String
}


enum LikeType {
    flag
    like
    karma
}

enum CommentTargetType {
   mission
   idea
   comment
}

enum LikeTargetType {
    idea
    comment
    mission
    user
    post
}


type Like {
    _id: ID
    user_id: String
    target_id: String
    meaning: LikeType
    target_type: LikeTargetType
    nb: Int
}

input CommentInput {
    title: String!
    description: String,
    image: String
    urldata: UrlDataInput
}


type Comment {
    _id: String
    title: String
    description: String,
    creator_id: String
    suggest:Boolean,
    target_id: String
    image: String
    target_type: CommentTargetType
    urldata: UrlData
    created: String
    updated: String
}

type NotificationToken {
    _id:    ID
    os:     String
    token:  String
    device: String
    updated:String
    created:String
}


enum Role {
    guest
    dev
    admin
    entadmin
    orgadmin
    tool
}

type NotifSettings {
    friends: Boolean
    chat: Boolean
    missions: Boolean
    ideas: Boolean
}

type Settings {
    anon:Boolean
    notifs:NotifSettings
}

type SettingItem {
  name:String
  value:String
}

type User {
    _id:        ID
    name:       String
    first_name: String
    email: String
    title: String
    username: String
    status:      String
    profileUrl:  String
    settings:Settings
    settingList:[SettingItem]
    roles:[Role]
    notificationTokens: [NotificationToken]
    validated:Boolean
    updated:String
    created:String
}
`

export const typeDefs = gql`




input UrlDataInput {
    link:String!
    image:String
    title:String
    desc:String
    site: String
    img_width:Int
    img_height:Int
}


# title: String
# author: String
# url: String
# description: String
# image: String
# img_width: Int
# img_height: Int
# img_type: String
# site: String




type UrlData {
    link:String
    image:String
    title:String
    desc:String
    site: String
    img_width:Int
    img_height:Int
}


${userDef}

`;