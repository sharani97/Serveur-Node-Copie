const { gql } = require ("apollo-server-express");
export const linkTypeDefs = gql`

# import User from ../users/schema.graphql

type Notif {
    _id: ID
    read: Boolean
    date: String
    org: String
    creator_id: String
    type: String
    text:String
    nb: Int
    uri:String
    rooturi:String
    target: String
    subject: String
    res: String
}

input InputSettings {
    empty: String
}

input InputNotifToken {
    os: String
    token: String
}

input NotifsSettingsInput {
    friends: Boolean
    chat: Boolean
    missions: Boolean
    ideas: Boolean
}

input SettingsInput {
    anon:Boolean
    notifs:NotifsSettingsInput
}

type Settings {
    anon:Boolean
    notifs:NotifSettings
}

input InputUser {
    name:       String
    first_name: String
    username: String
    profileUrl: String
    settings:InputSettings
}

extend type User {
    notifs: [Notif]
    points: [Point]
}

extend type Query {
    me(since: String) : User
    user(id: String): User
    users(ids: [String]): [User]
}



type Profile {
  me: User
}

input SettingItemInput {
  key: String
  value: String
}


extend type Mutation {
    updateMe(user:InputUser):Profile
    addNotifToken(token_data:InputNotifToken): Boolean
    updateSettings(input: SettingsInput): Profile
    deleteNotif(_id: String): Boolean
    updateSettingsList(input:[SettingItemInput]): Profile
    # sendKarma()
}



`;