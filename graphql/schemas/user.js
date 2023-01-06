// graphql/schema/user.js

const { gql } = require('apollo-server-express');

module.exports = gql`

 type User {
     id: String!
     firstname: String!
     lastname: String!
     username: String!
     email: String!
     password: String!
 }

extend type Query {
    getAllUsers : [User]
}

 extend type Mutation {
     register(firstname: String!, lastname: String!, username: String!, password: String!, email: String! ): RegisterResponse
     login(email: String!, password: String!): LoginResponse
 }

 type RegisterResponse {
    id: String!
    firstname: String
    lastname: String
    username: String
    email: String!
 }

  type LoginResponse {
    id: String!
    firstname: String!
    lastname: String!
    username: String!
    token: String!
 }
`;