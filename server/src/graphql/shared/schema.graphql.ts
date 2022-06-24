const { gql } = require ("apollo-server-express");
export const typeDefs = gql`

type Error {
    path: String,
    message:String
}





`;