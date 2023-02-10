// graphql/schema/user.js

const { gql } = require('apollo-server-express');

module.exports = gql`



extend type Query {
    getAllUsers,(cursor: String, limit: Int!): GetAllUsersV1
    getProfile(id: String!) : User
}

 extend type Mutation {
     register(firstname: String!, lastname: String!, username: String!, password: String!, email: String! ): RegisterResponse
     login(email: String!, password: String!): LoginResponse
 }

 type User {
     id: String!
     firstname: String!
     lastname: String!
     username: String!
     email: String!
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

 type GetAllUsersV1 {
    edges: [User]
    pageInfo: PageInfo!
  }

  type PageInfo {
    hasNextPage: Boolean!
    startCursor: String!
    endCursor: String!
  }
`;