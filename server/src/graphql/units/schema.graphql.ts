const { gql } = require ("apollo-server-express");
export const typeDefs = gql`


type Entity {
    _id: ID
    name: String
    orgs: [Org]
}

type Defs {
    id: ID
    fl: Float
    in: Int 
    st: String
}

type Group {
    _id: ID
    name: String
    org_id: String
    org: Org
    entity: Entity
    
}


type Org {
    _id: ID
    entity_id: String
    name: String
    groups: [Group]
    entity: [Entity]
}

type Query {
    orgs: [Org]
    org(id: String):Org
}

`;
