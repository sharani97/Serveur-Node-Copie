const { gql } = require ("apollo-server-express");

export const typeDefs = gql`
type Query {
  noop: Boolean
}
type Mutation {
    adminResetUserPassword(email: String, password:String): Boolean
}

`;