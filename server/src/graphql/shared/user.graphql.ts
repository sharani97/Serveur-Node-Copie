const { gql } = require ("apollo-server-express");
export const typeDefs = gql`

extend type Query {
    user(id: Int!): User
}

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


type User {
    _id:        ID
    name:       String
    firstname: String
    username: String
    status:      String
    profileUrl:  String
    settings:Object
    validated:Boolean
    points: [Points]
    updated:String
    created:String
}
`;