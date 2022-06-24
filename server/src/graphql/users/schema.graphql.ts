const { gql } = require ("apollo-server-express");
export const typeDefs = gql`

type Query {
    allUsers: [User]
    user(_id: String!): User
    test_me : User
}

type Mutation {
    addUser(name: String!, surname: String!): User
    deleteUser(_id: String!): User
    updateUser(_id: String!, name: String, firstname: String): User
}

`;
/*
export const typeDefs = gql`

type Points {
    _id:    ID
    user:   String
    dom:    String
    cat:    String
    primary:Boolean
    amount: Int
    updated:String
    created:String
}

type Reward {
    points: [Points]
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
    

type User {
    _id:        ID
    name:       String
    firstname: String
    username: String
    roles:[Role],
    notificationTokens:[NotificationToken]
    status:      String
    profileUrl:  String
    settings:Object
    validated:Boolean
    points: [Points]
    updated:String
    created:String
}
type Query {
  me : User
}


`;
*/